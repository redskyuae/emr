import { BedDouble, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import type { RoomType } from '@/app/api/lib/modules/room-type/schemas/room-type-schema';
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
import { formatDailyRate } from '../_utils/format-daily-rate';

type RoomTypeViewProps = {
  roomTypes: RoomType[];
  onEdit: (roomType: RoomType) => void;
  onDelete: (roomType: RoomType) => void;
};

function RoomTypeColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="border-border inline-block size-4 rounded-sm border"
      style={{ backgroundColor: color }}
    />
  );
}

function RoomTypeIcon({ color }: { color: string }) {
  return (
    <div
      className="flex size-10 items-center justify-center rounded-full"
      style={{ backgroundColor: color + '22' }}
    >
      <BedDouble className="size-5" style={{ color }} />
    </div>
  );
}

function RoomTypeActionsMenu({
  roomType,
  onEdit,
  onDelete,
}: {
  roomType: RoomType;
  onEdit: (roomType: RoomType) => void;
  onDelete: (roomType: RoomType) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${roomType.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(roomType)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(roomType)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoomTypeTableView({ roomTypes, onEdit, onDelete }: RoomTypeViewProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[24%] pl-4">Name</TableHead>
                <TableHead className="w-[12%]">Code</TableHead>
                <TableHead className="w-[10%]">Color</TableHead>
                <TableHead className="w-[16%] text-right">Daily rate</TableHead>
                <TableHead className="w-[26%]">Description</TableHead>
                <TableHead className="w-[12%] pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((roomType) => (
                <TableRow key={roomType.id}>
                  <TableCell className="truncate pl-4 font-medium">{roomType.name}</TableCell>
                  <TableCell className="truncate font-mono text-xs">{roomType.code}</TableCell>
                  <TableCell>
                    <RoomTypeColorSwatch color={roomType.color} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDailyRate(roomType.dailyRate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {roomType.description || '—'}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RoomTypeActionsMenu roomType={roomType} onEdit={onEdit} onDelete={onDelete} />
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

export function RoomTypeCardView({ roomTypes, onEdit, onDelete }: RoomTypeViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roomTypes.map((roomType) => (
        <Card key={roomType.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <RoomTypeIcon color={roomType.color} />

            <div>
              <h3 className="font-heading text-base font-semibold">{roomType.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Code: <span className="font-mono">{roomType.code}</span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Daily rate:{' '}
                <span className="text-foreground tabular-nums">
                  {formatDailyRate(roomType.dailyRate)}
                </span>
              </p>
              {roomType.description ? (
                <p className="text-muted-foreground mt-0.5 text-sm">{roomType.description}</p>
              ) : null}
            </div>

            <div className="flex gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(roomType)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(roomType)}
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

export function RoomTypeListView({ roomTypes, onEdit, onDelete }: RoomTypeViewProps) {
  return (
    <div className="space-y-3">
      {roomTypes.map((roomType) => (
        <Card key={roomType.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <RoomTypeIcon color={roomType.color} />
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold">{roomType.name}</h3>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <div>
                <span className="text-muted-foreground">Code: </span>
                <span className="font-mono">{roomType.code}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Daily rate: </span>
                <span className="tabular-nums">{formatDailyRate(roomType.dailyRate)}</span>
              </div>
              {roomType.description ? (
                <div className="min-w-0">
                  <span className="text-muted-foreground truncate">{roomType.description}</span>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 pl-14 sm:pl-0">
              <RoomTypeActionsMenu roomType={roomType} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
