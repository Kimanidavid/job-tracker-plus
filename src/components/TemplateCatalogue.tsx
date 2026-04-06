import { Check } from 'lucide-react';
import { resumeTemplates, type ResumeTemplate } from '@/data/resumeTemplates';
import generalPreview from '@/assets/template-general-cv.jpg';
import dataAnalystPreview from '@/assets/template-data-analyst.jpg';

const previewImages: Record<string, string> = {
  'general-cv': generalPreview,
  'data-analyst': dataAnalystPreview,
};

interface Props {
  selectedTemplate: ResumeTemplate | null;
  onSelect: (template: ResumeTemplate) => void;
}

export default function TemplateCatalogue({ selectedTemplate, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Choose a template style for your CV</p>
      <div className="grid grid-cols-2 gap-3">
        {resumeTemplates.map(template => {
          const isSelected = selectedTemplate?.id === template.id;
          const img = previewImages[template.id];
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
              {/* Preview image */}
              <div className="relative aspect-[3/4] bg-muted">
                {img ? (
                  <img
                    src={img}
                    alt={`${template.name} template preview`}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: template.preview.gradient }}
                  />
                )}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5 bg-card">
                <span className="text-xs font-semibold text-foreground">{template.name}</span>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
