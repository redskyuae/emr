import { AssetStatCardsSkeleton } from './_components/asset-stat-cards';
import { AttentionPanelSkeleton } from './_components/attention-panel';
import { CategoryDistributionSkeleton } from './_components/category-distribution';
import { UpcomingMaintenanceTableSkeleton } from './_components/upcoming-maintenance-table-skeleton';
import { WorkOrderStatCardsSkeleton } from './_components/work-order-stat-cards';

export default function PageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AssetStatCardsSkeleton />
        <WorkOrderStatCardsSkeleton />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistributionSkeleton />
        <AttentionPanelSkeleton />
      </section>

      <UpcomingMaintenanceTableSkeleton />
    </div>
  );
}
