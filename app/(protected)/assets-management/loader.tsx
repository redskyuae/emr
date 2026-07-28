import { AttentionPanelSkeleton } from './_components/attention-panel';
import { CategoryDistributionSkeleton } from './_components/category-distribution';
import { StatCardsSkeleton } from './_components/stat-cards';
import { UpcomingMaintenanceTableSkeleton } from './_components/upcoming-maintenance-table-skeleton';

export default function PageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <StatCardsSkeleton />

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistributionSkeleton />
        <AttentionPanelSkeleton />
      </section>

      <UpcomingMaintenanceTableSkeleton />
    </div>
  );
}
