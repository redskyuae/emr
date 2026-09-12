import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const consultationSteps = [
  {
    label: 'Intake',
    description: 'Vitals, complaint, and history',
  },
  {
    label: 'Examination',
    description: 'Systems review and findings',
  },
  {
    label: 'Diagnosis & Orders',
    description: 'Impression, treatment, and prescriptions',
  },
  {
    label: 'Complete Visit',
    description: 'Review, education, and disposition',
  },
] as const;

export function ConsultationProgress({
  currentStep,
  onStepChange,
}: {
  currentStep: number;
  onStepChange: (step: number) => void;
}) {
  const step = consultationSteps[currentStep];

  return (
    <Card className="shadow-fluent-2 gap-0 py-0">
      <CardContent className="space-y-3 p-3 md:p-4">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold">Consultation workflow</p>
            <p className="text-muted-foreground text-sm">
              Step {currentStep + 1} of {consultationSteps.length}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>

        <nav aria-label="Consultation steps">
          <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {consultationSteps.map((item, index) => {
              const active = index === currentStep;

              return (
                <li key={item.label}>
                  <Button
                    aria-current={active ? 'step' : undefined}
                    className={cn(
                      'h-auto w-full justify-start gap-2 px-3 py-2 text-left whitespace-normal',
                      !active && 'text-foreground'
                    )}
                    onClick={() => onStepChange(index)}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-sm border text-xs font-semibold',
                        active && 'border-primary-foreground/40'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.label}</span>
                      <span
                        className={cn(
                          'block text-xs font-normal',
                          active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
        </nav>
      </CardContent>
    </Card>
  );
}
