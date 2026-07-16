'use client';

import { useCallback, useState } from 'react';

// Shared server-error state for chart form sheets: holds the exact API error
// strings surfaced above the form after a failed save.
export function useChartFormServerErrors() {
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const clearServerErrors = useCallback(() => setServerErrors([]), []);

  return { serverErrors, setServerErrors, clearServerErrors };
}
