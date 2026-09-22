'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type WorkOrderTypeOption = {
  id: number;
  name: string;
};

type WorkOrderQueueToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  typeOptions: WorkOrderTypeOption[];
  typeValue: string;
  onTypeChange: (value: string) => void;
  onNewWorkOrder: () => void;
};

export function WorkOrderQueueToolbar({
  search,
  onSearchChange,
  typeOptions,
  typeValue,
  onTypeChange,
  onNewWorkOrder,
}: WorkOrderQueueToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);

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
    <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
      <InputGroup className="bg-background h-9 2xl:max-w-sm">
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Search work orders…"
          aria-label="Search work orders"
          className="text-sm"
        />
      </InputGroup>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={typeValue === '' ? 'default' : 'outline'}
          aria-pressed={typeValue === ''}
          onClick={() => onTypeChange('')}
          className={cn(typeValue !== '' && 'bg-background')}
        >
          All types
        </Button>
        {typeOptions.map((type) => {
          const isActive = typeValue === String(type.id);

          return (
            <Button
              key={type.id}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              aria-pressed={isActive}
              onClick={() => onTypeChange(String(type.id))}
              className={cn(!isActive && 'bg-background')}
            >
              {type.name}
            </Button>
          );
        })}
      </div>

      <Button type="button" className="w-full sm:w-auto 2xl:ml-auto" onClick={onNewWorkOrder}>
        <Plus className="size-4" />
        <span>New work order</span>
      </Button>
    </div>
  );
}
