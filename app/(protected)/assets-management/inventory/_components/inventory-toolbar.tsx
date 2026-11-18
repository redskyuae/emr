'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ALL = 'all';

type InventoryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryOptions: { id: number; name: string; color: string }[];
  categoryValue: string;
  onCategoryChange: (value: string) => void;
  statusOptions: { id: number; name: string }[];
  statusValue: string;
  onStatusChange: (value: string) => void;
  onAddAsset: () => void;
};

export function InventoryToolbar({
  search,
  onSearchChange,
  categoryOptions,
  categoryValue,
  onCategoryChange,
  statusOptions,
  statusValue,
  onStatusChange,
  onAddAsset,
}: InventoryToolbarProps) {
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
    <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
      <div className="grid gap-2 sm:grid-cols-3 2xl:w-full 2xl:max-w-xl">
        <InputGroup className="bg-background h-9 sm:col-span-2">
          <InputGroupAddon>
            <Search className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search assets, tags, models…"
            aria-label="Search assets, tags, models"
            className="text-sm"
          />
        </InputGroup>

        <Select
          value={categoryValue || ALL}
          onValueChange={(value) => onCategoryChange(value === ALL ? '' : value)}
        >
          <SelectTrigger className="bg-background h-9 w-full sm:col-span-1">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={statusValue === '' ? 'default' : 'outline'}
          aria-pressed={statusValue === ''}
          onClick={() => onStatusChange('')}
          className={cn(statusValue !== '' && 'bg-background')}
        >
          All
        </Button>
        {statusOptions.map((status) => {
          const isActive = statusValue === String(status.id);

          return (
            <Button
              key={status.id}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              aria-pressed={isActive}
              onClick={() => onStatusChange(String(status.id))}
              className={cn(!isActive && 'bg-background')}
            >
              {status.name}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:ml-auto 2xl:justify-end">
        <Button type="button" className="w-full sm:w-auto" onClick={onAddAsset}>
          <Plus className="size-4" />
          <span>Add Asset</span>
        </Button>
      </div>
    </div>
  );
}
