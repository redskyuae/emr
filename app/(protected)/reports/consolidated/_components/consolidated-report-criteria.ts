'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

// The generated report lives in the URL, so it survives a refresh and can be shared.
const criteriaParsers = {
  to: parseAsString,
  from: parseAsString,
  patient: parseAsInteger,
};

/** `?patient=7&from=2026-11-01&to=2026-11-20` once a report is generated. */
export function useConsolidatedReportCriteria() {
  return useQueryStates(criteriaParsers);
}
