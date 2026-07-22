import type { VariantProps } from 'class-variance-authority';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export function appointmentStatusVariant(
  category: Appointment['appointmentStatus']['category']
): BadgeVariant {
  if (category === 'scheduled') return 'secondary';
  if (category === 'confirmed') return 'default';
  if (category === 'checked_in') return 'outline';
  if (category === 'completed') return 'secondary';
  if (category === 'cancelled') return 'destructive';
  if (category === 'no_show') return 'destructive';

  return 'outline';
}
