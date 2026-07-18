// Pure bed-day charge maths (ADR 0040). No DB access, no framework — exercised
// hard by unit tests for same-day, transfer-day, month-boundary and TZ-midnight
// edges. Callers resolve the Tenant's configured Time Zone (ADR 0026) and pass
// it in; this default only covers callers/tests that don't.
export const DEFAULT_TENANT_TIME_ZONE = 'Asia/Kolkata';

export type OccupancyTransfer = {
  fromBedId: number;
  toBedId: number;
  transferredAt: Date;
};

export type OccupancySource = {
  admittedAt: Date;
  dischargedAt: Date;
  currentBedId: number;
  transfers: OccupancyTransfer[];
};

export type OccupancySegment = {
  bedId: number;
  start: Date;
  end: Date;
};

// A single Admission's timeline broken into one span per occupied Bed: admission
// → each transfer → discharge. The first segment's Bed is the source of the first
// transfer (or the current Bed when there were none); each later segment takes the
// destination Bed of the transfer that opened it.
export function computeOccupancySegments(source: OccupancySource): OccupancySegment[] {
  const transfers = [...source.transfers].sort(
    (a, b) => a.transferredAt.getTime() - b.transferredAt.getTime()
  );

  if (transfers.length === 0) {
    return [{ bedId: source.currentBedId, start: source.admittedAt, end: source.dischargedAt }];
  }

  const segments: OccupancySegment[] = [];

  segments.push({
    bedId: transfers[0].fromBedId,
    start: source.admittedAt,
    end: transfers[0].transferredAt,
  });

  for (let index = 0; index < transfers.length; index += 1) {
    const transfer = transfers[index];
    const nextBoundary =
      index + 1 < transfers.length ? transfers[index + 1].transferredAt : source.dischargedAt;

    segments.push({
      bedId: transfer.toBedId,
      start: transfer.transferredAt,
      end: nextBoundary,
    });
  }

  return segments;
}

function zonedDayIndex(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = formatter.format(date).split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

// Calendar days occupied, interpreted in the Tenant Time Zone, with a floor of 1:
// a same-day admit-and-discharge bills one day, and a transfer date lands on both
// the departing and arriving segments (standard hospital practice, ADR 0040).
export function countBillableDays(
  start: Date,
  end: Date,
  timeZone: string = DEFAULT_TENANT_TIME_ZONE
) {
  const diff = zonedDayIndex(end, timeZone) - zonedDayIndex(start, timeZone);
  return Math.max(1, diff);
}
