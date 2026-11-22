'use client';

import { CiSearch } from 'react-icons/ci';
import { PiFunnelXLight } from 'react-icons/pi';

import {
  CollapsibleFilterToolbar,
  FilterSelect,
} from '@/components/app/collapsible-filter-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
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
  advancedCount,
  onSearchChange,
  onFilterChange,
  onClear,
}: {
  today: Date;
  filters: VisitListFilters;
  searchTerm: string;
  activeCount: number;
  advancedCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (patch: Omit<Partial<VisitListFilters>, 'query'>) => void;
  onClear: () => void;
}) {
  const preset = activePreset(filters, today);

  return (
    <CollapsibleFilterToolbar
      advancedCount={advancedCount}
      defaultExpanded={advancedCount > 0}
      actions={
        <Button
          type="button"
          size="lg"
          variant="ghost"
          disabled={activeCount === 0}
          onClick={onClear}
        >
          <PiFunnelXLight className="size-4" />
          Clear filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      }
      advanced={
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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
        </div>
      }
    >
      <InputGroup className="w-full sm:w-auto sm:min-w-64 sm:flex-1 xl:max-w-sm">
        <InputGroupAddon>
          <CiSearch className="size-4" />
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
        size="lg"
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

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Input
          type="date"
          aria-label="From date"
          className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          value={filters.from ?? ''}
          max={filters.to ?? undefined}
          onChange={(event) => onFilterChange({ from: event.target.value || null })}
        />
        <span className="text-muted-foreground text-sm" aria-hidden="true">
          to
        </span>
        <Input
          type="date"
          aria-label="To date"
          className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          value={filters.to ?? ''}
          min={filters.from ?? undefined}
          onChange={(event) => onFilterChange({ to: event.target.value || null })}
        />
      </div>
    </CollapsibleFilterToolbar>
  );
}
