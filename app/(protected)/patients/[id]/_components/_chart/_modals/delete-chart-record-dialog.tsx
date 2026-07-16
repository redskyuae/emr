'use client';

import { Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type DeleteChartRecordDialogProps = {
  open: boolean;
  entityLabel: string;
  itemLabel: string | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteChartRecordDialog({
  open,
  entityLabel,
  itemLabel,
  isPending,
  onConfirm,
  onClose,
}: DeleteChartRecordDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete {entityLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            {itemLabel ? (
              <>
                Delete {entityLabel.toLowerCase()} &ldquo;<strong>{itemLabel}</strong>&rdquo;? This
                action cannot be undone.
              </>
            ) : (
              `This ${entityLabel.toLowerCase()} will be deleted.`
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
