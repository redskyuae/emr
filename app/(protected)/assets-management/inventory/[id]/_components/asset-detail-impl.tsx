'use client';

import Link from 'next/link';
import { ArrowLeft, Boxes } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAssetQuery } from '@/app/queries/assets-management/useAsset';
import { formatAedCompact } from '@/app/(protected)/assets-management/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

function BackLink() {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/assets-management/inventory">
        <ArrowLeft className="size-4" />
        Inventory
      </Link>
    </Button>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function formatMoney(value: number | null) {
  return value === null ? undefined : formatAedCompact(value);
}

function AssetDetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Asset">
      <Card className="shadow-fluent-2">
        <CardContent className="flex items-center gap-4 py-4">
          <Skeleton className="size-12 shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>

      {[0, 1, 2].map((section) => (
        <Card key={section} className="shadow-fluent-2">
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AssetDetailImpl({ assetId }: { assetId: number }) {
  const assetQuery = useAssetQuery(assetId);

  if (assetQuery.isLoading) {
    return <AssetDetailSkeleton />;
  }

  if (assetQuery.isError || !assetQuery.data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Boxes className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Asset not found</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(assetQuery.error)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const asset = assetQuery.data;

  return (
    <div className="space-y-4">
      <BackLink />

      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: asset.category.color + '1a', color: asset.category.color }}
              aria-hidden="true"
            >
              <Boxes className="size-5" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-semibold">{asset.name}</h2>
                <Badge variant="outline">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: asset.status.color }}
                    aria-hidden="true"
                  />
                  {asset.status.name}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono text-sm">
                {asset.serialNumber} · {asset.category.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Asset ID" value={`#${asset.id}`} />
          <DetailField label="Serial number" value={asset.serialNumber} />
          <DetailField label="Model" value={asset.model} />
          <DetailField label="Manufacturer" value={asset.manufacturer} />
          <DetailField label="Category" value={asset.category.name} />
          <DetailField label="Status" value={asset.status.name} />
          <DetailField label="Condition" value={asset.condition?.name} />
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Facility" value={asset.facility} />
          <DetailField label="Department" value={asset.department} />
          <DetailField label="Location" value={asset.location} />
          <DetailField label="Assigned to" value={asset.custodian} />
        </CardContent>
      </Card>

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Service &amp; value</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Purchase date" value={asset.purchaseDate} />
          <DetailField label="Warranty expiry" value={asset.warrantyExpiry} />
          <DetailField label="Cost" value={formatMoney(asset.cost)} />
          <DetailField label="Current value" value={formatMoney(asset.currentValue)} />
          <DetailField label="Last service" value={asset.lastServiceDate} />
          <DetailField label="Next service" value={asset.nextServiceDate} />
          <DetailField label="Calibration date" value={asset.calibrationDate} />
        </CardContent>
      </Card>
    </div>
  );
}
