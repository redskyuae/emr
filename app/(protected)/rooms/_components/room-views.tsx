import { BedDouble, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { Room } from '@/app/api/lib/modules/room/schemas/room-schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRoomStatusClassName, getRoomStatusLabel } from '../_utils/room-status';

type RoomViewProps = {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
};

function formatLocation(room: Room) {
  const parts = [room.floor ? `Floor ${room.floor}` : null, room.wing].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function RoomStatusBadge({ status }: { status: Room['status'] }) {
  return (
    <Badge variant="outline" className={getRoomStatusClassName(status)}>
      {getRoomStatusLabel(status)}
    </Badge>
  );
}

function RoomTypeBadge({ roomType }: { roomType: Room['roomType'] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="border-border inline-block size-2.5 shrink-0 rounded-full border"
        style={{ backgroundColor: roomType.color }}
      />
      <span className="truncate">{roomType.name}</span>
    </span>
  );
}

function RoomIcon({ color }: { color: string }) {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: color + '22' }}
    >
      <BedDouble className="size-5" style={{ color }} />
    </div>
  );
}

function RoomActionsMenu({
  room,
  onEdit,
  onDelete,
}: {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for Room ${room.roomNumber}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(room)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(room)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoomTableView({ rooms, onEdit, onDelete }: RoomViewProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[860px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%] pl-4">Room</TableHead>
                <TableHead className="w-[18%]">Type</TableHead>
                <TableHead className="w-[14%]">Status</TableHead>
                <TableHead className="w-[9%] text-right">Beds</TableHead>
                <TableHead className="w-[17%]">Location</TableHead>
                <TableHead className="w-[18%]">Department</TableHead>
                <TableHead className="w-[10%] pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="truncate pl-4 font-medium">{room.roomNumber}</TableCell>
                  <TableCell className="truncate">
                    <RoomTypeBadge roomType={room.roomType} />
                  </TableCell>
                  <TableCell>
                    <RoomStatusBadge status={room.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{room.bedCount}</TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {formatLocation(room)}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {room.department || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RoomActionsMenu room={room} onEdit={onEdit} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoomCardView({ rooms, onEdit, onDelete }: RoomViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <Card key={room.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <RoomIcon color={room.roomType.color} />
              <RoomStatusBadge status={room.status} />
            </div>

            <div className="space-y-0.5">
              <h3 className="font-heading text-base font-semibold">Room {room.roomNumber}</h3>
              <p className="text-muted-foreground text-sm">
                <RoomTypeBadge roomType={room.roomType} />
              </p>
              <p className="text-muted-foreground text-sm">
                {room.bedCount} {room.bedCount === 1 ? 'bed' : 'beds'} · {formatLocation(room)}
              </p>
              {room.department ? (
                <p className="text-muted-foreground text-sm">{room.department}</p>
              ) : null}
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(room)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(room)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RoomListView({ rooms, onEdit, onDelete }: RoomViewProps) {
  return (
    <div className="space-y-3">
      {rooms.map((room) => (
        <Card key={room.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <RoomIcon color={room.roomType.color} />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">Room {room.roomNumber}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <RoomTypeBadge roomType={room.roomType} />
              <RoomStatusBadge status={room.status} />
              <div className="tabular-nums">
                {room.bedCount} {room.bedCount === 1 ? 'bed' : 'beds'}
              </div>
              <div className="text-muted-foreground min-w-0 truncate">{formatLocation(room)}</div>
            </div>

            <div className="shrink-0 pl-14 sm:pl-0">
              <RoomActionsMenu room={room} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
