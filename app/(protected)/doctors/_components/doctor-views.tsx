import { CircleOff, MoreVertical, Pencil, RotateCcw, Stethoscope, UserRound } from 'lucide-react';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
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

export type DoctorStatusAction = 'deactivate' | 'reactivate';

type DoctorViewProps = {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
  onStatusAction: (doctor: Doctor, action: DoctorStatusAction) => void;
};

function dash(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '-';
}

function DoctorStatusBadge({ doctor }: { doctor: Doctor }) {
  return doctor.isActive ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    >
      Active
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      Inactive
    </Badge>
  );
}

function DoctorAvatar() {
  return (
    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
      <Stethoscope className="size-5" />
    </div>
  );
}

function DoctorActionsMenu({
  doctor,
  onEdit,
  onStatusAction,
}: {
  doctor: Doctor;
  onEdit: (doctor: Doctor) => void;
  onStatusAction: (doctor: Doctor, action: DoctorStatusAction) => void;
}) {
  const statusAction = doctor.isActive ? 'deactivate' : 'reactivate';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${doctor.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(doctor)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant={doctor.isActive ? 'destructive' : 'default'}
          onClick={() => onStatusAction(doctor, statusAction)}
        >
          {doctor.isActive ? <CircleOff className="size-4" /> : <RotateCcw className="size-4" />}
          {doctor.isActive ? 'Deactivate' : 'Reactivate'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DoctorTableView({ doctors, onEdit, onStatusAction }: DoctorViewProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[920px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%] pl-4">Doctor</TableHead>
                <TableHead className="w-[16%]">Specialty</TableHead>
                <TableHead className="w-[14%]">Staff code</TableHead>
                <TableHead className="w-[18%]">Designation</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[8%] pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="pl-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doctor.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{doctor.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="truncate">{dash(doctor.specialtyName)}</TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {dash(doctor.staffCode)}
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate">
                    {dash(doctor.designation)}
                  </TableCell>
                  <TableCell>
                    <DoctorStatusBadge doctor={doctor} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DoctorActionsMenu
                      doctor={doctor}
                      onEdit={onEdit}
                      onStatusAction={onStatusAction}
                    />
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

export function DoctorCardView({ doctors, onEdit, onStatusAction }: DoctorViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="shadow-fluent-2">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <DoctorAvatar />
              <DoctorStatusBadge doctor={doctor} />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold">{doctor.name}</h3>
              <p className="text-muted-foreground text-sm">{doctor.email}</p>
              <p className="flex items-center gap-1.5 text-sm">
                <UserRound className="text-muted-foreground size-3.5" />
                {dash(doctor.specialtyName)}
              </p>
              <p className="text-muted-foreground text-sm">{dash(doctor.designation)}</p>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(doctor)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={doctor.isActive ? 'text-destructive hover:text-destructive' : undefined}
                onClick={() =>
                  onStatusAction(doctor, doctor.isActive ? 'deactivate' : 'reactivate')
                }
              >
                {doctor.isActive ? (
                  <CircleOff className="size-3.5" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                {doctor.isActive ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DoctorListView({ doctors, onEdit, onStatusAction }: DoctorViewProps) {
  return (
    <div className="space-y-3">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <DoctorAvatar />
              <div className="min-w-0">
                <h3 className="font-heading truncate text-base font-semibold">{doctor.name}</h3>
                <p className="text-muted-foreground truncate text-sm">{doctor.email}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pl-14 text-sm sm:flex-row sm:items-center sm:gap-6 sm:pl-0">
              <span className="truncate">{dash(doctor.specialtyName)}</span>
              <span className="text-muted-foreground truncate">{dash(doctor.designation)}</span>
              <DoctorStatusBadge doctor={doctor} />
            </div>

            <div className="shrink-0 pl-14 sm:pl-0">
              <DoctorActionsMenu doctor={doctor} onEdit={onEdit} onStatusAction={onStatusAction} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
