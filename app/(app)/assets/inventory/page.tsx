'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, Download, Search } from 'lucide-react';

import {
  assetCategories,
  assets,
  assetStatusBadgeMap,
  formatAedCompact,
  type Asset,
  type AssetCategory,
  type AssetStatus,
  type BadgeToneConfig,
} from '@/app/(app)/assets/mock-data';
import { AddAssetSheet } from '@/app/(app)/assets/inventory/components/add-asset-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type CategoryFilter = AssetCategory['id'] | 'all';
type StatusFilter = AssetStatus | 'all';

const categoryById = new Map(assetCategories.map((category) => [category.id, category]));

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Use', value: 'in-use' },
  { label: 'Available', value: 'available' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Repair', value: 'repair' },
  { label: 'Retired', value: 'retired' },
];

const categoryIconTileClassById: Record<AssetCategory['id'], string> = {
  imaging: 'bg-chart-1/10 text-chart-1',
  monitoring: 'bg-chart-2/10 text-chart-2',
  life: 'bg-destructive/10 text-destructive',
  surgical: 'bg-chart-3/10 text-chart-3',
  lab: 'bg-chart-5/10 text-chart-5',
  mobility: 'bg-chart-4/10 text-chart-4',
  it: 'bg-primary/10 text-primary',
};

function normalizeSearchTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}

function assetMatchesSearch(asset: Asset, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  return [asset.name, asset.id, asset.manufacturer, asset.model].some((value) =>
    value.toLocaleLowerCase().includes(searchTerm)
  );
}

function badgeWithDot(config: BadgeToneConfig) {
  return (
    <Badge variant="outline" className={config.className}>
      <span className={cn('size-1.5 rounded-full', config.dotClassName)} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

function formatResultSubtitle(filteredAssets: Asset[]) {
  const categoryCount = new Set(filteredAssets.map((asset) => asset.categoryId)).size;
  const assetLabel = filteredAssets.length === 1 ? 'asset' : 'assets';
  const categoryLabel = categoryCount === 1 ? 'category' : 'categories';

  return `${filteredAssets.length} ${assetLabel} across ${categoryCount} ${categoryLabel}`;
}

function formatAssetValue(value: number) {
  if (value === 0) {
    return '—';
  }

  return formatAedCompact(value);
}

function CategoryLabel({ category }: { category: AssetCategory }) {
  return (
    <div className="flex min-w-40 items-center gap-2">
      <span className={cn('size-2.5 shrink-0 rounded-full', category.color)} aria-hidden="true" />
      <span className="font-medium">{category.name}</span>
    </div>
  );
}

function AssetIdentity({ asset, category }: { asset: Asset; category: AssetCategory }) {
  return (
    <div className="flex min-w-64 items-center gap-3">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md',
          categoryIconTileClassById[category.id]
        )}
        aria-hidden="true"
      >
        <category.icon className="size-4" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="truncate font-semibold">{asset.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          <span className="font-mono">{asset.id}</span>
          <span aria-hidden="true"> · </span>
          {asset.manufacturer}
        </p>
      </div>
    </div>
  );
}

function AssignedTo({ asset }: { asset: Asset }) {
  if (!asset.custodian) {
    return <span className="text-muted-foreground italic">Unassigned</span>;
  }

  return (
    <div className="min-w-36 space-y-1">
      <p className="font-medium">{asset.custodian}</p>
      <p className="text-muted-foreground text-xs">{asset.department}</p>
    </div>
  );
}

export default function AssetInventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredAssets = useMemo(() => {
    const searchTerm = normalizeSearchTerm(searchQuery);

    return assets.filter((asset) => {
      const matchesSearch = assetMatchesSearch(asset, searchTerm);
      const matchesCategory = categoryFilter === 'all' || asset.categoryId === categoryFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg leading-tight font-semibold">Inventory</h2>
        <p className="text-muted-foreground text-sm">{formatResultSubtitle(filteredAssets)}</p>
      </div>

      <Card className="shadow-fluent-2">
        <CardHeader className="border-b">
          <div>
            <CardTitle>Asset directory</CardTitle>
            <CardDescription>Tracked Assets across Facilities and departments.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px] 2xl:min-w-[520px]">
              <InputGroup className="bg-background h-9">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search assets, tags, models…"
                  aria-label="Search assets, tags, models"
                  className="text-sm"
                />
              </InputGroup>

              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
              >
                <SelectTrigger className="bg-background h-9 w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {assetCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className={cn('size-2 rounded-full', category.color)} />
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;

                return (
                  <Button
                    key={filter.value}
                    type="button"
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    aria-pressed={isActive}
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(!isActive && 'bg-background')}
                  >
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center 2xl:ml-auto 2xl:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                <Download className="size-4" />
                <span>Export</span>
              </Button>
              <AddAssetSheet />
            </div>
          </div>

          <Table className="min-w-[1120px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next service</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-10 pr-4" aria-label="Details" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length ? (
                filteredAssets.map((asset) => {
                  const category = categoryById.get(asset.categoryId);

                  if (!category) {
                    return null;
                  }

                  return (
                    <TableRow key={asset.id} className="cursor-pointer">
                      <TableCell className="py-3 pl-4">
                        <AssetIdentity asset={asset} category={category} />
                      </TableCell>
                      <TableCell>
                        <CategoryLabel category={category} />
                      </TableCell>
                      <TableCell className="text-muted-foreground min-w-52">
                        {asset.location}
                      </TableCell>
                      <TableCell>
                        <AssignedTo asset={asset} />
                      </TableCell>
                      <TableCell>{badgeWithDot(assetStatusBadgeMap[asset.status])}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {asset.nextService}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {formatAssetValue(asset.value)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <ChevronRight
                          className="text-muted-foreground ml-auto size-4"
                          aria-hidden="true"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-8">
                      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                        <Search className="size-4" />
                      </div>
                      <p className="font-medium">No assets match your filters</p>
                      <p className="text-muted-foreground text-sm">
                        Try a different search, category, or status.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
