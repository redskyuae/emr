'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RoomType } from '@/app/api/lib/modules/room-type/schemas/room-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteRoomType } from '@/app/queries/room-masters/room-types/useDeleteRoomType';
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

type RoomTypeDeleteDialogProps = {
  roomType: RoomType | null;
  onClose: () => void;
  onDeleted: (roomTypeId: number) => void;
};

export function RoomTypeDeleteDialog({ roomType, onClose, onDeleted }: RoomTypeDeleteDialogProps) {
  const deleteMutation = useDeleteRoomType();

  async function handleConfirmDelete() {
    if (!roomType) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(roomType.id);
      toast.success('Room Type deleted.');
      onDeleted(roomType.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={roomType !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Room Type?</AlertDialogTitle>
          <AlertDialogDescription>
            {roomType ? (
              <>
                Delete Room Type &ldquo;<strong>{roomType.name}</strong>&rdquo;? Rooms must first be
                reassigned to another Room Type. This action cannot be undone.
              </>
            ) : (
              'This Room Type will be deleted.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirmDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
