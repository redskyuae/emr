type VisitWithDate = {
  checkedInAt: string | Date;
};

export function getRecentVisits<T extends VisitWithDate>(visits: T[], limit = 3) {
  return [...visits]
    .sort(
      (left, right) => new Date(right.checkedInAt).getTime() - new Date(left.checkedInAt).getTime()
    )
    .slice(0, limit);
}
