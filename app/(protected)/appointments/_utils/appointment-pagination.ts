type PaginationCorrectionInput = {
  pageParam: number;
  normalizedPage: number;
  totalPages?: number;
  isPlaceholderData: boolean;
};

export function getPaginationCorrection({
  pageParam,
  normalizedPage,
  totalPages,
  isPlaceholderData,
}: PaginationCorrectionInput) {
  if (pageParam !== normalizedPage) {
    return normalizedPage;
  }

  if (totalPages === undefined || isPlaceholderData) {
    return undefined;
  }

  const lastPage = Math.max(1, totalPages);
  return normalizedPage > lastPage ? lastPage : undefined;
}
