'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Room } from '@/app/api/lib/modules/room/schemas/room-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDeleteRoom } from '@/app/queries/rooms/useDeleteRoom';
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

type RoomDeleteDialogProps = {
  room: Room | null;
  onClose: () => void;
  onDeleted: (roomId: number) => void;
};

export function RoomDeleteDialog({ room, onClose, onDeleted }: RoomDeleteDialogProps) {
  const deleteMutation = useDeleteRoom();

  async function handleConfirmDelete() {
    if (!room) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(room.id);
      toast.success('Room deleted.');
      onDeleted(room.id);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={room !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Room?</AlertDialogTitle>
          <AlertDialogDescription>
            {room ? (
              <>
                Delete Room &ldquo;<strong>{room.roomNumber}</strong>&rdquo;? An occupied Room
                cannot be deleted. This action cannot be undone.
              </>
            ) : (
              'This Room will be deleted.'
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
