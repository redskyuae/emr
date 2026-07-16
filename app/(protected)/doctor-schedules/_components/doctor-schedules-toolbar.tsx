'use client';

import { Plus, RotateCcw } from 'lucide-react';

import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL = 'all';

type DoctorSchedulesToolbarProps = {
  doctors: Doctor[];
  doctorsLoading: boolean;
  doctorValue: string;
  fromDateValue: string;
  toDateValue: string;
  onAddSchedule: () => void;
  onClearFilters: () => void;
  onDoctorChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
};

export function DoctorSchedulesToolbar({
  doctors,
  doctorValue,
  toDateValue,
  doctorsLoading,
  fromDateValue,
  onAddSchedule,
  onClearFilters,
  onDoctorChange,
  onToDateChange,
  onFromDateChange,
}: DoctorSchedulesToolbarProps) {
  const hasFilters = Boolean(doctorValue || fromDateValue || toDateValue);

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <Select
            value={doctorValue || ALL}
            disabled={doctorsLoading}
            onValueChange={(value) => onDoctorChange(value === ALL ? '' : value)}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Filter by Doctor">
              <SelectValue placeholder="All Doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Doctors</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={String(doctor.id)}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={fromDateValue}
            aria-label="Filter schedules from date"
            onChange={(event) => onFromDateChange(event.target.value)}
            className="h-9"
          />

          <Input
            type="date"
            value={toDateValue}
            aria-label="Filter schedules to date"
            onChange={(event) => onToDateChange(event.target.value)}
            className="h-9"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:ml-auto">
          <Button
            type="button"
            variant="outline"
            disabled={!hasFilters}
            onClick={onClearFilters}
            className="bg-background"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button type="button" onClick={onAddSchedule}>
            <Plus className="size-4" />
            New Doctor Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
