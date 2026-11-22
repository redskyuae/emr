'use client';

import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { PiPlusLight } from 'react-icons/pi';

import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ChartPanel({
  title,
  icon,
  count,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-muted-foreground">{icon}</span>
          {title}
          {count > 0 ? (
            <span className="text-muted-foreground text-sm font-normal">({count})</span>
          ) : null}
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <PiPlusLight className="size-4" />
          {addLabel}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// The one empty state for the five Chart panels. The title is clinical wording, so callers keep it
// exactly ("No known allergies recorded" must not read as a finding); the panel header keeps its
// Add button.
export function ChartPanelEmpty({ icon, title }: { icon: IconType; title: string }) {
  return <EmptyState size="sm" tone="blue" icon={icon} title={title} />;
}

// Shared row-action menu (edit / delete) used by chart panels.
export function ChartRowActions({
  onEdit,
  onDelete,
  editDisabled = false,
  extra,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editDisabled?: boolean;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      {extra}
      {onEdit ? (
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} disabled={editDisabled}>
          Edit
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      ) : null}
    </div>
  );
}
