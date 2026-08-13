import { AssetStatCardsWidget } from './asset-stat-cards';
import { AttentionPanelWidget } from './attention-panel';
import { CategoryDistributionWidget } from './category-distribution';
import { UpcomingMaintenanceTableWidget } from './upcoming-maintenance-table-widget';
import { WorkOrderStatCardsWidget } from './work-order-stat-cards';

export function OverviewPageImpl() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AssetStatCardsWidget />
        <WorkOrderStatCardsWidget />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistributionWidget />
        <AttentionPanelWidget />
      </section>

      <UpcomingMaintenanceTableWidget />
    </div>
  );
}
