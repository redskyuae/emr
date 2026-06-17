import { Wrench } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export default function AssetMaintenancePage() {
  return (
    <Empty className="bg-card shadow-fluent-2 min-h-[360px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wrench className="size-5" />
        </EmptyMedia>
        <EmptyTitle>Coming soon</EmptyTitle>
        <EmptyDescription>Maintenance content is being prepared.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
