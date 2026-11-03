import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ACTIVITY_TYPE_CLASS,
  ACTIVITY_TYPE_LABEL,
  CONTACT_STATUS,
} from '../_utils/outreach-presentation';
import type { ActivityStatus, ActivityType, ContactStatus } from '../_utils/outreach-types';

export function ActivityTypeBadge({ type }: { type: ActivityType }) {
  return (
    <Badge variant="outline" className={ACTIVITY_TYPE_CLASS[type]}>
      {ACTIVITY_TYPE_LABEL[type]}
    </Badge>
  );
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === 'completed'
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-border bg-muted text-foreground'
      )}
    >
      {status === 'completed' ? 'Completed' : 'Planned'}
    </Badge>
  );
}

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const { label, className } = CONTACT_STATUS[status];

  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', className)}>
      {label}
    </Badge>
  );
}
