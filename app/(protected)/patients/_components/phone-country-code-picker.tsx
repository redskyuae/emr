import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { getPhoneCountry, PHONE_COUNTRIES } from '@/lib/phone-numbers';

type PhoneCountryCodePickerProps = {
  value: string;
  onChange: (iso: string) => void;
};

/** Searchable by country name, ISO code or calling code. */
export function PhoneCountryCodePicker({ value, onChange }: PhoneCountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = getPhoneCountry(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={
            selected ? `Country code: ${selected.name} +${selected.dialCode}` : 'Country code'
          }
          className="w-28 shrink-0 justify-between px-2.5 font-normal"
        >
          <span className="truncate tabular-nums">
            {selected ? `${selected.iso} +${selected.dialCode}` : 'Code'}
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search country or code…" />
          <CommandList>
            <CommandEmpty>No country matches.</CommandEmpty>
            {PHONE_COUNTRIES.map((country) => (
              <CommandItem
                key={country.iso}
                value={`${country.name} ${country.iso} +${country.dialCode}`}
                data-checked={country.iso === value}
                onSelect={() => {
                  onChange(country.iso);
                  setOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  +{country.dialCode}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
