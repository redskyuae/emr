import { Boxes } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export default function AssetInventoryPage() {
  return (
    <Empty className="bg-card shadow-fluent-2 min-h-[360px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Boxes className="size-5" />
        </EmptyMedia>
        <EmptyTitle>Coming soon</EmptyTitle>
        <EmptyDescription>Asset inventory content is being prepared.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
