'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Plus, Search, Table as TableIcon } from 'lucide-react';

import { VISIT_STATUS_CATEGORY_LABELS } from '@/app/(protected)/visit-masters/visit-statuses/_utils/visit-status-form-schema';
import type { VisitStatusCategory } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const ALL = 'all';
const VISIT_STATUS_CATEGORIES = Object.keys(VISIT_STATUS_CATEGORY_LABELS) as VisitStatusCategory[];

type VisitsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusCategory: string;
  onStatusCategoryChange: (value: string) => void;
  doctorId: string;
  onDoctorIdChange: (value: string) => void;
  view: 'table' | 'queue';
  onViewChange: (view: 'table' | 'queue') => void;
};

export function VisitsToolbar({
  search,
  onSearchChange,
  statusCategory,
  onStatusCategoryChange,
  doctorId,
  onDoctorIdChange,
  view,
  onViewChange,
}: VisitsToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  const doctorsQuery = useDoctorsQuery({ limit: 100, status: 'active' });
  const doctors = doctorsQuery.data?.data ?? [];

  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchDraft(search);
  }

  useEffect(() => {
    if (searchDraft === search) {
      return;
    }

    const timer = setTimeout(() => onSearchChange(searchDraft.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchDraft, search, onSearchChange]);

  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value) onViewChange(value as 'table' | 'queue');
          }}
          variant="outline"
          size="lg"
          spacing={0}
        >
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="size-4" />
            List
          </ToggleGroupItem>
          <ToggleGroupItem value="queue" aria-label="Queue view">
            <LayoutGrid className="size-4" />
            Queue
          </ToggleGroupItem>
        </ToggleGroup>

        <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by visit number, name, or MRN"
            aria-label="Search Visits"
          />
        </InputGroup>

        <Select
          value={statusCategory || ALL}
          onValueChange={(value) => onStatusCategoryChange(value === ALL ? '' : value)}
        >
          <SelectTrigger className="h-9 w-full lg:w-44" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {VISIT_STATUS_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {VISIT_STATUS_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={doctorId || ALL}
          onValueChange={(value) => onDoctorIdChange(value === ALL ? '' : value)}
        >
          <SelectTrigger className="h-9 w-full lg:w-48" aria-label="Filter by doctor">
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All doctors</SelectItem>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={String(doctor.id)}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" asChild className="lg:ml-auto">
          <Link href="/visits/new">
            <Plus className="size-4" />
            New visit
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
