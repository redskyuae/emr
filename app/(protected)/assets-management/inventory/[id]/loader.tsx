import { AssetDetailSkeleton } from '@/app/(protected)/assets-management/inventory/[id]/_components/asset-detail-impl';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetDetailLoader() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Asset">
      <Skeleton className="-ml-2 h-8 w-28" />
      <AssetDetailSkeleton />
    </div>
  );
}
