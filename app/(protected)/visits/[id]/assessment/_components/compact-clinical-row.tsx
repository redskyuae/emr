import type { ReactNode } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CompactClinicalRow({
  title,
  meta,
  detail,
  badge,
  disabled,
  onRemove,
}: {
  title: string;
  meta?: string;
  detail?: string;
  badge?: ReactNode;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="bg-background grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1 rounded border px-1.5 py-1">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-[10px] font-medium" title={title}>
            {title}
          </span>
          {badge}
        </div>
        {meta || detail ? (
          <p
            className="text-muted-foreground truncate text-[9px]"
            title={[meta, detail].filter(Boolean).join(' · ')}
          >
            {[meta, detail].filter(Boolean).join(' · ')}
          </p>
        ) : null}
      </div>
      <Button
        aria-label={`Remove ${title}`}
        className="size-6"
        disabled={disabled}
        onClick={onRemove}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  );
}
