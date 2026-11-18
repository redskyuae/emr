'use client';

import { LayoutGrid, LayoutList, Plus, RotateCcw, Table as TableIcon } from 'lucide-react';

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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const ALL = 'all';

export type ViewLayout = 'table' | 'card' | 'list';

type Props = {
  therapists: Therapist[];
  viewLayout: ViewLayout;
  onViewLayoutChange: (layout: ViewLayout) => void;
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
  viewLayout,
  onViewLayoutChange,
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
      <CardContent className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <ToggleGroup
          type="single"
          value={viewLayout}
          onValueChange={(value) => {
            if (value) onViewLayoutChange(value as ViewLayout);
          }}
          variant="outline"
          size="lg"
          spacing={0}
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="size-4" />
            Table
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label="Card view">
            <LayoutGrid className="size-4" />
            Card
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <LayoutList className="size-4" />
            List
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <Select
            value={therapistValue || ALL}
            disabled={therapistsLoading}
            onValueChange={(value) => onTherapistChange(value === ALL ? '' : value)}
          >
            <SelectTrigger className="h-10 w-full" aria-label="Filter by Therapist">
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
            className="h-10"
          />
          <Input
            type="date"
            value={toDateValue}
            aria-label="Filter schedules to date"
            onChange={(event) => onToDateChange(event.target.value)}
            className="h-10"
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
