import { notFound } from 'next/navigation';

import { AssetDetailImpl } from './_components/asset-detail-impl';
import { parseAssetIdParam } from '../_utils/parse-asset-id';

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params;
  const assetId = parseAssetIdParam(id);

  if (assetId === null) {
    notFound();
  }

  return <AssetDetailImpl assetId={assetId} />;
}
