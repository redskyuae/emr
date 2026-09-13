import { CalendarClock, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { BookingPath } from '../_utils/book-appointment-types';

const paths: Array<{
  value: BookingPath;
  title: string;
  description: string;
  icon: typeof CalendarClock;
}> = [
  {
    value: 'CONSULTATION',
    title: 'Consultation',
    description: 'See a Doctor at an available time.',
    icon: CalendarClock,
  },
  {
    value: 'PROCEDURE',
    title: 'Procedure',
    description: 'Reserve a Treatment Session and resources.',
    icon: Sparkles,
  },
];

export function BookingPathSelector({
  value,
  onChange,
  disabled,
}: {
  value: BookingPath | '';
  onChange: (value: BookingPath) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Booking Path</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {paths.map((path) => {
            const Icon = path.icon;
            const selected = value === path.value;

            return (
              <Button
                key={path.value}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onChange(path.value)}
                className={cn(
                  'h-auto min-h-14 items-center justify-start gap-3 p-3 text-left whitespace-normal',
                  path.value === 'PROCEDURE'
                    ? 'border-procedure/20 bg-procedure/5 hover:bg-procedure/10'
                    : 'border-primary/20 bg-primary/5 hover:bg-primary/10',
                  selected &&
                    (path.value === 'PROCEDURE'
                      ? 'border-procedure ring-procedure/20 ring-2'
                      : 'border-primary ring-primary/20 ring-2')
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    path.value === 'PROCEDURE'
                      ? 'bg-procedure/15 text-procedure'
                      : 'bg-primary/15 text-primary'
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {path.title}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
