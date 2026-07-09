'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Search, UserRoundSearch } from 'lucide-react';

import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type PatientOption = { id: number; name: string; mrn: string };

type PatientComboboxProps = {
  value: number | undefined;
  selectedLabel: string | null;
  onSelect: (patient: PatientOption) => void;
  disabled?: boolean;
  invalid?: boolean;
};

function patientFullName(patient: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  return [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
}

export function PatientCombobox({
  value,
  selectedLabel,
  onSelect,
  disabled,
  invalid,
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const patientsQuery = usePatientsQuery({
    page: 1,
    limit: 8,
    query: search.trim() || undefined,
    isActive: true,
  });
  const patients = patientsQuery.data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? selectedLabel : 'Search patient by name or MRN...'}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search by name or MRN..."
          />
          <CommandList>
            {patientsQuery.isLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-sm">
                <Search className="size-4 animate-pulse" />
                Searching...
              </div>
            ) : patients.length === 0 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-1 py-2">
                  <UserRoundSearch className="text-muted-foreground size-5" />
                  <span>No active Patients found.</span>
                </div>
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={String(patient.id)}
                    onSelect={() => {
                      onSelect({
                        id: patient.id,
                        name: patientFullName(patient),
                        mrn: patient.mrn,
                      });
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('size-4', value === patient.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="min-w-0">
                      <p className="truncate">{patientFullName(patient)}</p>
                      <p className="text-muted-foreground font-mono text-xs">{patient.mrn}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
