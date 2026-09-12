type VisitWithDate = {
  occurredAt: string;
};

export function getRecentVisits<T extends VisitWithDate>(visits: T[], limit = 3) {
  return [...visits]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, limit);
}
