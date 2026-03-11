import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User, Loader2, Sparkles, MessageSquare, Briefcase, DollarSign, Linkedin, FileText, Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-agent`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-transcribe`;

const QUICK_PROMPTS = [
  { label: 'Interview Prep', icon: MessageSquare, prompt: 'Help me prepare for a technical interview. What are the most common questions and how should I structure my answers using the STAR method?' },
  { label: 'Salary Negotiation', icon: DollarSign, prompt: 'I received a job offer and want to negotiate a higher salary. Give me a step-by-step negotiation strategy with example scripts.' },
  { label: 'LinkedIn Profile', icon: Linkedin, prompt: 'Review and optimize my LinkedIn profile. Give me tips for writing a compelling headline, summary, and improving my overall presence.' },
  { label: 'Cover Letter', icon: FileText, prompt: 'Help me write a compelling cover letter. What structure should I follow and what makes a cover letter stand out?' },
  { label: 'Career Pivot', icon: Briefcase, prompt: 'I want to transition to a new career field. How should I approach a career pivot, identify transferable skills, and position myself for the change?' },
  { label: 'Job Search Strategy', icon: Sparkles, prompt: 'Create a comprehensive job search strategy for me. Include tips on where to search, how to network, application timing, and follow-up etiquette.' },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    onError(err.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) { onError('No response body'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { done = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  if (buffer.trim()) {
    for (let raw of buffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

// Strip markdown for TTS
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

export default function CareerAgent() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const playTTS = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    const plainText = stripMarkdown(text);
    if (!plainText || plainText.length < 3) return;

    // Truncate to avoid huge TTS calls
    const truncated = plainText.length > 2000 ? plainText.slice(0, 2000) + '...' : plainText;

    try {
      setIsSpeaking(true);
      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: truncated }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: upsertAssistant,
        onDone: () => {
          setIsLoading(false);
          // Auto-play TTS when voice is enabled
          if (assistantSoFar) {
            playTTS(assistantSoFar);
          }
        },
        onError: (err) => {
          setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to connect. Please try again.' }]);
      setIsLoading(false);
    }
  }, [messages, isLoading, playTTS]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioBlob.size < 100) {
          setIsRecording(false);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch(STT_URL, {
            method: 'POST',
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          });

          if (!response.ok) throw new Error('Transcription failed');

          const result = await response.json();
          const transcript = result.text?.trim();

          if (transcript) {
            send(transcript);
          } else {
            toast({ title: 'No speech detected', description: 'Please try speaking again.', variant: 'destructive' });
          }
        } catch (err) {
          console.error('STT error:', err);
          toast({ title: 'Transcription failed', description: 'Could not process your voice input.', variant: 'destructive' });
        }
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      toast({ title: 'Microphone access required', description: 'Please allow microphone access to use voice input.', variant: 'destructive' });
    }
  }, [send, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Career Agent</h1>
            <p className="text-sm text-muted-foreground">Your AI-powered career assistant</p>
          </div>
        </div>
        <Button
          variant={voiceEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (voiceEnabled) stopSpeaking();
          }}
          className="gap-2"
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {voiceEnabled ? 'Voice On' : 'Voice Off'}
        </Button>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">How can I help your career today?</h3>
              <p className="text-sm text-muted-foreground mb-2 max-w-md">
                I can help with interview prep, salary negotiation, LinkedIn optimization, cover letters, and career strategy.
              </p>
              <p className="text-xs text-muted-foreground mb-6 max-w-md flex items-center gap-1 justify-center">
                <Mic className="w-3 h-3" /> Tap the microphone to speak, or enable Voice to hear responses read aloud.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-lg">
                {QUICK_PROMPTS.map((qp) => (
                  <Button
                    key={qp.label}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 h-auto py-2 px-3 text-xs text-left justify-start"
                    onClick={() => send(qp.prompt)}
                    disabled={isLoading}
                  >
                    <qp.icon className="w-3.5 h-3.5 shrink-0 text-primary" />
                    {qp.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0 p-1.5 rounded-lg bg-primary/10 h-fit mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="shrink-0 p-1.5 rounded-lg bg-secondary h-fit mt-0.5">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="shrink-0 p-1.5 rounded-lg bg-primary/10 h-fit">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="border-t border-border px-3 py-2 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Speaking...</span>
            </div>
            <Button variant="ghost" size="sm" onClick={stopSpeaking} className="h-6 px-2 text-xs">
              <Square className="w-3 h-3 mr-1" /> Stop
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex gap-2 items-end">
            {/* Voice input button */}
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`shrink-0 ${isRecording ? 'animate-pulse' : ''}`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Listening... tap mic to stop' : 'Ask about interviews, salary, LinkedIn, cover letters...'}
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              rows={1}
              disabled={isLoading || isRecording}
            />
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            AI responses are suggestions — always verify important career decisions independently.
          </p>
        </div>
      </Card>
    </div>
  );
}
