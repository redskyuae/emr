import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { cn } from '@/lib/utils';
import { formatMoney } from '../../billing/_utils/invoice-display';
import { visitStatusPresentation } from '../../visits/_utils/visit-status';
import type { summarizeVisits } from '../_utils/visit-list-filters';

type Summary = ReturnType<typeof summarizeVisits>;

const STATUS_ORDER: VisitStatus[] = ['CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'];

function Tile({
  label,
  value,
  hint,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <span className="font-heading text-2xl leading-none font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </>
  );
  const className = cn(
    'bg-card shadow-fluent-2 flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left',
    onClick &&
      'hover:bg-accent focus-visible:ring-ring transition-colors outline-none focus-visible:ring-2',
    active && 'border-primary bg-accent'
  );

  return onClick ? (
    <button type="button" aria-pressed={active} className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function VisitListSummary({
  summary,
  activeStatus,
  onStatusChange,
}: {
  summary: Summary;
  activeStatus: VisitStatus | null;
  onStatusChange: (status: VisitStatus | null) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Tile
        label="All Visits"
        value={summary.total}
        active={activeStatus === null}
        onClick={() => onStatusChange(null)}
      />
      {STATUS_ORDER.map((status) => (
        <Tile
          key={status}
          label={visitStatusPresentation(status).label}
          value={summary.byStatus[status]}
          active={activeStatus === status}
          onClick={() => onStatusChange(activeStatus === status ? null : status)}
        />
      ))}
      <Tile
        label="Balance due"
        value={`AED ${formatMoney(summary.balanceDue)}`}
        hint={
          summary.unbilledCompleted > 0
            ? `${summary.unbilledCompleted} completed Visit${summary.unbilledCompleted === 1 ? '' : 's'} not billed`
            : 'Every completed Visit is billed'
        }
      />
    </div>
  );
}
