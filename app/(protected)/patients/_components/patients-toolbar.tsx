'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserRoundPlus } from 'lucide-react';

import { PATIENT_GENDER_OPTIONS } from '@/app/(protected)/patients/_utils/patient-value-sets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PatientsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  genderValue: string;
  onGenderChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
};

const ALL = 'all';

export function PatientsToolbar({
  search,
  onSearchChange,
  genderValue,
  onGenderChange,
  statusValue,
  onStatusChange,
}: PatientsToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);

  // Keep the local draft in sync when the URL-backed value changes elsewhere
  // (e.g. cleared filters, back/forward navigation) by adjusting state during
  // render rather than in an effect — the documented React pattern for syncing
  // state to a changed prop.
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchDraft(search);
  }

  // Debounce so we don't hit the server on every keystroke.
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
        <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search by name, MRN, or phone"
            aria-label="Search Patients"
          />
        </InputGroup>

        <Select
          value={genderValue || ALL}
          onValueChange={(value) => onGenderChange(value === ALL ? '' : value)}
        >
          <SelectTrigger className="h-9 w-full lg:w-40" aria-label="Filter by gender">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All genders</SelectItem>
            {PATIENT_GENDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusValue || ALL}
          onValueChange={(value) => onStatusChange(value === ALL ? '' : value)}
        >
          <SelectTrigger className="h-9 w-full lg:w-40" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" asChild className="lg:ml-auto">
          <Link href="/patients/new">
            <UserRoundPlus className="size-4" />
            Register patient
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
