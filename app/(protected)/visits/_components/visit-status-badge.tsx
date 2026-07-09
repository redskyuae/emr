import type { VisitStatusSummary } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { Badge } from '@/components/ui/badge';

export function VisitStatusBadge({ status }: { status: VisitStatusSummary }) {
  return (
    <Badge
      variant="outline"
      style={{
        borderColor: `${status.color}40`,
        backgroundColor: `${status.color}1a`,
        color: status.color,
      }}
    >
      {status.name}
    </Badge>
  );
}
