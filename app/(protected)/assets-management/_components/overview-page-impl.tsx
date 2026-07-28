import { AttentionPanelWidget } from './attention-panel';
import { CategoryDistributionWidget } from './category-distribution';
import { StatCardsWidget } from './stat-cards';
import { UpcomingMaintenanceTableWidget } from './upcoming-maintenance-table';

export function OverviewPageImpl() {
  return (
    <div className="space-y-6">
      <StatCardsWidget />

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistributionWidget />
        <AttentionPanelWidget />
      </section>

      <UpcomingMaintenanceTableWidget />
    </div>
  );
}
