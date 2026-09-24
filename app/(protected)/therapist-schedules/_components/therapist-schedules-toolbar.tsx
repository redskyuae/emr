'use client';

import { Plus, RotateCcw } from 'lucide-react';

import type { Therapist } from '@/app/api/lib/modules/therapist/schemas/therapist-schema';
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

type Props = {
  therapists: Therapist[];
  therapistsLoading: boolean;
  therapistValue: string;
  fromDateValue: string;
  toDateValue: string;
  canCreate: boolean;
  onAddSchedule: () => void;
  onClearFilters: () => void;
  onTherapistChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
};

export function TherapistSchedulesToolbar({
  therapists,
  therapistValue,
  toDateValue,
  fromDateValue,
  therapistsLoading,
  canCreate,
  onAddSchedule,
  onClearFilters,
  onTherapistChange,
  onToDateChange,
  onFromDateChange,
}: Props) {
  const hasFilters = Boolean(therapistValue || fromDateValue || toDateValue);
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <Select
            value={therapistValue || ALL}
            disabled={therapistsLoading}
            onValueChange={(value) => onTherapistChange(value === ALL ? '' : value)}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Filter by Therapist">
              <SelectValue placeholder="All Therapists" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Therapists</SelectItem>
              {therapists.map((therapist) => (
                <SelectItem key={therapist.id} value={String(therapist.id)}>
                  {therapist.name}
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
          {canCreate ? (
            <Button type="button" onClick={onAddSchedule}>
              <Plus className="size-4" />
              New Therapist Schedule
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
