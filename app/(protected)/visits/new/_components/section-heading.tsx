import type { ReactNode } from 'react';

/** Card heading used by every Check-in section: icon tile, title and one-line description. */
export function SectionHeading({
  id,
  icon,
  title,
  description,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <h2 id={id} className="text-lg leading-tight font-bold">
          {title}
        </h2>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
    </div>
  );
}
