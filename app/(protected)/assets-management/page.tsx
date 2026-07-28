import type { Metadata } from 'next';

import { getAppPageMeta } from '@/components/app/app-shell-config';
import { OverviewPageImpl } from './_components/overview-page-impl';

const pageMeta = getAppPageMeta('/assets-management');

export const metadata: Metadata = {
  title: pageMeta.title,
  description: pageMeta.subtitle,
};

export default function AssetOverviewPage() {
  return <OverviewPageImpl />;
}
