import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { resumeTemplates, templateCategories, type ResumeTemplate } from '@/data/resumeTemplates';

interface Props {
  selectedTemplate: ResumeTemplate | null;
  onSelect: (template: ResumeTemplate) => void;
}

export default function TemplateCatalogue({ selectedTemplate, onSelect }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all'
    ? resumeTemplates
    : resumeTemplates.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {templateCategories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-7 px-3"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Template grid */}
      <ScrollArea className="h-[520px]">
        <div className="grid grid-cols-2 gap-3 pr-2">
          {filtered.map(template => {
            const isSelected = selectedTemplate?.id === template.id;
            const p = template.palette;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className={`group relative text-left rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                {/* Mini CV mockup */}
                <div className="relative" style={{ background: p.offWhite }}>
                  {/* Header bar */}
                  <div style={{ background: p.navy, padding: '8px 10px' }}>
                    <div style={{ width: '60%', height: '6px', borderRadius: '3px', background: p.white, opacity: 0.9, marginBottom: '3px' }} />
                    <div style={{ width: '40%', height: '3px', borderRadius: '2px', background: p.steel, opacity: 0.7 }} />
                  </div>
                  {/* Accent stripe */}
                  <div style={{ height: '2px', background: p.accent }} />
                  {/* Two columns */}
                  <div style={{ display: 'flex', height: '52px' }}>
                    <div style={{ width: '27%', background: p.midTone, padding: '6px 4px' }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: '80%', height: '2px', borderRadius: '1px', background: p.steel, opacity: 0.5, marginBottom: '4px' }} />
                      ))}
                    </div>
                    <div style={{ flex: 1, padding: '6px 8px' }}>
                      <div style={{ width: '50%', height: '3px', borderRadius: '1px', background: p.accent, marginBottom: '4px' }} />
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: `${90 - i * 10}%`, height: '2px', borderRadius: '1px', background: p.darkText, opacity: 0.2, marginBottom: '3px' }} />
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 bg-card">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-foreground truncate">{template.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                    {template.description}
                  </p>

                  {/* Palette dots */}
                  <div className="flex gap-1 mt-1.5">
                    {[p.navy, p.midTone, p.accent, p.steel, p.light].map((c, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full border border-border/50" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
