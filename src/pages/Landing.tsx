import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Briefcase, Sparkles, FileText, Search, Mail, MessageSquare, BarChart3,
  ArrowRight, CheckCircle2, Zap, Clock, Shield, Star, ChevronRight
} from 'lucide-react';
import heroImage from '@/assets/hero-hire.jpg';
import trackerImage from '@/assets/feature-tracker.jpg';
import autopilotImage from '@/assets/feature-autopilot.jpg';

const features = [
  {
    icon: Briefcase,
    title: 'Smart Job Tracker',
    description: 'Kanban board with 5 stages. Track every application from Applied to Offer with AI-powered match scores.',
  },
  {
    icon: FileText,
    title: 'AI Resume Builder',
    description: 'Paste a job description and our AI tailors your resume with ATS keywords, achievement bullets, and skill gaps.',
  },
  {
    icon: Search,
    title: 'Autopilot Search',
    description: 'Toggle on and let AI scour the web for matching jobs, score them, and add the best fits to your tracker.',
  },
  {
    icon: Mail,
    title: 'Follow-up Manager',
    description: 'Never miss a follow-up. AI drafts personalized emails for every active application on your timeline.',
  },
  {
    icon: MessageSquare,
    title: 'AI Career Agent',
    description: 'Chat with your AI career coach for salary negotiation scripts, interview prep, and LinkedIn outreach.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Conversion funnels, stage breakdowns, and company pipeline views to optimize your job search strategy.',
  },
];

const stats = [
  { value: '10x', label: 'Faster Applications' },
  { value: '85%', label: 'Interview Rate' },
  { value: '3hrs', label: 'Saved Per Day' },
  { value: '50k+', label: 'Jobs Landed' },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer at Google',
    quote: 'AgentHire\'s AI resume builder got me past ATS filters I\'d been stuck on for months. Landed 3 interviews in my first week.',
    stars: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager at Stripe',
    quote: 'The autopilot search found roles I didn\'t even know existed. One click and they\'re tracked. It\'s like having a recruiter working 24/7.',
    stars: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'UX Designer at Figma',
    quote: 'The follow-up manager is a game changer. AI-drafted emails that sound like me. I just hit send.',
    stars: 5,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
              <img src="/Agenthire.png" alt="AgentHire" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight">AgentHire</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')}>
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Job Search Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Land Your Dream Job on{' '}
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  Autopilot
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Stop spending hours on applications. Our AI handles resume tailoring, job matching, follow-ups, and interview prep — so you can focus on what matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="text-base px-8" onClick={() => navigate('/auth')}>
                  Start Free — No Credit Card
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="text-base" onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  See How It Works
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Free forever plan</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> No setup required</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                <img
                  src={heroImage}
                  alt="Professionals celebrating a successful hire in a modern office"
                  className="w-full h-auto object-cover"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-lg hidden md:block">
                <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Offer Received!</p>
                    <p className="text-xs text-muted-foreground">Senior Developer at TechCo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium text-primary mb-3">EVERYTHING YOU NEED</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Six AI Tools. One Platform.
            </h2>
            <p className="text-muted-foreground text-lg">
              Every part of your job search — automated, optimized, and tracked in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium text-primary mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              From Sign-Up to Offer in 3 Steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Zap, title: 'Connect & Configure', description: 'Sign up, paste your resume, and tell us your dream roles. AI sets up your search profile in seconds.' },
              { step: '02', icon: Clock, title: 'AI Does the Work', description: 'Autopilot finds jobs, tailors resumes, and drafts follow-ups. You review and approve with one click.' },
              { step: '03', icon: Shield, title: 'Land the Offer', description: 'AI preps you for interviews, coaches negotiations, and tracks every stage until you sign the offer.' },
            ].map((item) => (
              <div key={item.step} className="relative text-center space-y-4">
                <div className="text-5xl font-bold text-primary/10">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Feature Sections */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 space-y-24">
          {/* Tracker Feature */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Briefcase className="w-3.5 h-3.5" />
                Smart Tracking
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Every Application. One Board.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                See your entire job search at a glance. Drag applications through stages, get AI match scores, and never lose track of a lead.
              </p>
              <ul className="space-y-3">
                {['Kanban board with 5 customizable stages', 'AI match scoring for each job', 'Interview scheduling & reminders', 'One-click status updates'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-border/50">
              <img src={trackerImage} alt="Professional tracking job applications" className="w-full h-auto object-cover" loading="lazy" />
            </div>
          </div>

          {/* Autopilot Feature */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-border/50">
              <img src={autopilotImage} alt="Professional relaxing while AI handles job search" className="w-full h-auto object-cover" loading="lazy" />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Save Hours Every Day
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Sit Back. Let AI Handle It.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                While you focus on interview prep or simply take a break, our AI is tailoring resumes, finding jobs, and drafting follow-up emails — all on autopilot.
              </p>
              <ul className="space-y-3">
                {['AI-powered job matching & scoring', 'Auto-generated cover letters & resumes', 'Smart follow-up email drafting', 'Career coaching & salary negotiation'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-medium text-primary mb-3">TRUSTED BY JOB SEEKERS</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              People Love AgentHire
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative rounded-3xl bg-primary overflow-hidden p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-700 opacity-90" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground tracking-tight">
                Ready to Land Your Next Role?
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                Join thousands of job seekers who let AI handle the grunt work. Start free, no credit card required.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="text-base px-8"
                onClick={() => navigate('/auth')}
              >
                Get Started Free
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                <img src="/Agenthire.png" alt="AgentHire" className="w-4 h-4 object-contain" />
              </div>
              <span className="font-semibold">AgentHire</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AgentHire. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
