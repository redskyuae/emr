import { cn } from '@/lib/utils';

const STEPS = [
  {
    title: 'Plan it',
    body: 'Save as Planned. It shows under Upcoming, and assigned staff see it on their phones.',
  },
  {
    title: 'Collect contacts on the day',
    body: 'Staff open the activity on their phone and add each interested person. The contact count updates by itself.',
  },
  {
    title: 'Close it',
    body: 'Mark Completed and add people reached and a short summary.',
  },
];

export function LoggingStepsAside({ completed }: { completed: boolean }) {
  const activeStep = completed ? 2 : 0;

  return (
    <aside
      aria-label="How logging works"
      className="bg-card shadow-fluent-2 space-y-4 rounded-lg border p-4"
    >
      <h2 className="text-base font-semibold">How an activity is logged</h2>
      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-bold',
                index === activeStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
        Already done and not logged? Choose Completed above and record it in one go.
      </p>
    </aside>
  );
}
