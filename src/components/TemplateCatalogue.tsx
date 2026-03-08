import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Palette } from 'lucide-react';
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
                {/* Color preview bar */}
                <div
                  className="h-20 w-full relative overflow-hidden"
                  style={{ background: template.preview.gradient }}
                >
                  {/* Mini preview mockup */}
                  <div className="absolute inset-2 flex flex-col items-center justify-center">
                    <div className="w-16 h-1.5 rounded-full bg-white/80 mb-1" />
                    <div className="w-10 h-1 rounded-full bg-white/50 mb-2" />
                    <div className="flex gap-1">
                      {[template.palette.primary, template.palette.secondary, template.palette.accent].map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-white/30" style={{ background: c }} />
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
                <div className="p-2.5" style={{ background: template.preview.thumbnailBg }}>
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
                    {[template.palette.primary, template.palette.secondary, template.palette.accent, template.palette.divider].map((c, i) => (
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
