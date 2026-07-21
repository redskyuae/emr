
export function parseAssetIdParam(id: string): number | null {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const assetId = Number(id);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}
