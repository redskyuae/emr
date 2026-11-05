import { useState } from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

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
import { CHARGE_ITEMS } from '../_data/counter-seed';
import { formatAed } from '../_utils/money';
import type { ChargeItem } from '../_utils/counter-types';

const CATEGORIES = ['Consultation', 'Investigation', 'Therapy', 'Pharmacy', 'Wellness'] as const;

/** Searchable by code, CPT code or description; choosing an item adds it straight away. */
export function ChargeItemPicker({ onPick }: { onPick: (item: ChargeItem) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  function changeOpen(next: boolean) {
    setOpen(next);
    // Start every search from scratch, otherwise the last query hides the next charge.
    setSearch('');
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Add a Charge Item"
          className="w-full justify-between font-normal"
        >
          <span className="text-muted-foreground flex items-center gap-2">
            <Plus className="size-4" />
            Add a charge — search service or CPT code
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput
            placeholder="Search Charge Items…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No Charge Item matches.</CommandEmpty>
            {CATEGORIES.map((category) => (
              <CommandGroup key={category} heading={category}>
                {CHARGE_ITEMS.filter((item) => item.category === category).map((item) => (
                  <CommandItem
                    key={item.code}
                    value={`${item.code} ${item.cpt ?? ''} ${item.description}`}
                    onSelect={() => {
                      onPick(item);
                      changeOpen(false);
                    }}
                  >
                    <span className="text-muted-foreground w-14 shrink-0 font-mono text-xs">
                      {item.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.description}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatAed(item.unitPrice)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
