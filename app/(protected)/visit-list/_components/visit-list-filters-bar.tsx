'use client';

import { FilterX, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { VISIT_STATUS_FILTERS } from '../../visits/_utils/visit-status';
import { VISIT_LIST_DOCTORS, VISIT_LIST_VISIT_TYPES } from '../_data/static-visit-list';
import {
  BILLING_OPTIONS,
  DATE_PRESETS,
  PATIENT_TYPE_OPTIONS,
  SOURCE_OPTIONS,
  datePresetRange,
  type VisitListFilters,
} from '../_utils/visit-list-filters';

const ALL = 'all';

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  allLabel: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
      <SelectTrigger className="h-9 w-full" aria-label={label}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function activePreset(filters: VisitListFilters, today: Date) {
  if (!filters.from && !filters.to) {
    return 'all';
  }

  return (
    DATE_PRESETS.find((preset) => {
      const range = datePresetRange(preset.daysBack, today);
      return range.from === filters.from && range.to === filters.to;
    })?.value ?? 'custom'
  );
}

export function VisitListFiltersBar({
  today,
  filters,
  searchTerm,
  activeCount,
  onSearchChange,
  onFilterChange,
  onClear,
}: {
  today: Date;
  filters: VisitListFilters;
  searchTerm: string;
  activeCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (patch: Omit<Partial<VisitListFilters>, 'query'>) => void;
  onClear: () => void;
}) {
  const preset = activePreset(filters, today);

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <InputGroup className="bg-background shadow-fluent-2 h-9 xl:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search Visit, MRN, name, phone, booking or invoice..."
              aria-label="Search Visits"
            />
          </InputGroup>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={preset === 'custom' ? '' : preset}
            aria-label="Visit date range"
            className="flex-wrap"
            onValueChange={(value) => {
              if (!value) {
                return;
              }

              if (value === 'all') {
                onFilterChange({ from: null, to: null });
                return;
              }

              const selected = DATE_PRESETS.find((option) => option.value === value);

              if (selected) {
                onFilterChange(datePresetRange(selected.daysBack, today));
              }
            }}
          >
            {DATE_PRESETS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.label}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem value="all">All dates</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2 xl:ml-auto">
            <Input
              type="date"
              aria-label="From date"
              className="h-9 w-full sm:w-40"
              value={filters.from ?? ''}
              max={filters.to ?? undefined}
              onChange={(event) => onFilterChange({ from: event.target.value || null })}
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              aria-label="To date"
              className="h-9 w-full sm:w-40"
              value={filters.to ?? ''}
              min={filters.from ?? undefined}
              onChange={(event) => onFilterChange({ to: event.target.value || null })}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <FilterSelect
            label="Filter by Doctor"
            allLabel="All Doctors"
            value={filters.doctor}
            options={VISIT_LIST_DOCTORS.map((doctor) => ({ value: doctor.id, label: doctor.name }))}
            onChange={(doctor) => onFilterChange({ doctor })}
          />
          <FilterSelect
            label="Filter by status"
            allLabel="All statuses"
            value={filters.status}
            options={VISIT_STATUS_FILTERS}
            onChange={(status) => onFilterChange({ status: status as VisitListFilters['status'] })}
          />
          <FilterSelect
            label="Filter by Visit type"
            allLabel="All Visit types"
            value={filters.type}
            options={VISIT_LIST_VISIT_TYPES.map((type) => ({ value: type.code, label: type.name }))}
            onChange={(type) => onFilterChange({ type })}
          />
          <FilterSelect
            label="Filter by source"
            allLabel="Appointment & Walk-in"
            value={filters.source}
            options={SOURCE_OPTIONS}
            onChange={(source) => onFilterChange({ source: source as VisitListFilters['source'] })}
          />
          <FilterSelect
            label="Filter by Patient type"
            allLabel="New & Established"
            value={filters.patientType}
            options={PATIENT_TYPE_OPTIONS}
            onChange={(patientType) =>
              onFilterChange({ patientType: patientType as VisitListFilters['patientType'] })
            }
          />
          <FilterSelect
            label="Filter by billing"
            allLabel="All billing"
            value={filters.billing}
            options={BILLING_OPTIONS}
            onChange={(billing) =>
              onFilterChange({ billing: billing as VisitListFilters['billing'] })
            }
          />
          <Button
            type="button"
            variant="ghost"
            className="h-9"
            disabled={activeCount === 0}
            onClick={onClear}
          >
            <FilterX className="size-4" />
            Clear filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
