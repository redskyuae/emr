'use client';

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

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
    <Card className="shadow-fluent-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-muted-foreground">{icon}</span>
          {title}
          {count > 0 ? (
            <span className="text-muted-foreground text-sm font-normal">({count})</span>
          ) : null}
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          {addLabel}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ChartPanelEmpty({ message }: { message: string }) {
  return (
    <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed px-4 py-6 text-center text-sm">
      {message}
    </p>
  );
}

// Shared row-action menu (edit / delete) used by chart panels.
export function ChartRowActions({
  onEdit,
  onDelete,
  editDisabled = false,
  extra,
}: {
  onEdit?: () => void;
  onDelete: () => void;
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        Delete
      </Button>
    </div>
  );
}
