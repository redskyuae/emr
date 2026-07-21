'use client';

import { AlertCircle } from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAssetQuery } from '@/app/queries/assets-management/useAsset';
import { formatAedCompact } from '@/app/(protected)/assets-management/mock-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

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

export function AssetDetailRow({ assetId, colSpan }: { assetId: number; colSpan: number }) {
  const assetQuery = useAssetQuery(assetId);
  const asset = assetQuery.data;

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
        {assetQuery.isLoading ? (
          <AssetDetailSkeleton />
        ) : assetQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Asset details</AlertTitle>
            <AlertDescription>{getApiErrorMessage(assetQuery.error)}</AlertDescription>
          </Alert>
        ) : asset ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Asset Details</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Asset ID" value={`#${asset.id}`} />
              <DetailField label="Category" value={asset.category.name} />
              <DetailField label="Status" value={asset.status.name} />
              <DetailField label="Condition" value={asset.condition?.name} />
              <DetailField label="Serial number" value={asset.serialNumber} />
              <DetailField label="Model" value={asset.model} />
              <DetailField label="Manufacturer" value={asset.manufacturer} />
              <DetailField label="Facility" value={asset.facility} />
              <DetailField label="Location" value={asset.location} />
              <DetailField label="Department" value={asset.department} />
              <DetailField label="Assigned to" value={asset.custodian} />
              <DetailField label="Purchase date" value={asset.purchaseDate} />
              <DetailField label="Warranty expiry" value={asset.warrantyExpiry} />
              <DetailField label="Cost" value={formatMoney(asset.cost)} />
              <DetailField label="Current value" value={formatMoney(asset.currentValue)} />
              <DetailField label="Last service" value={asset.lastServiceDate} />
              <DetailField label="Next service" value={asset.nextServiceDate} />
              <DetailField label="Calibration date" value={asset.calibrationDate} />
            </div>
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

function AssetDetailSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
