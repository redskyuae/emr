'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { SEED_STATE } from '../_data/outreach-seed';
import { outreachReducer, type OutreachAction } from '../_utils/outreach-ledger';
import type { OutreachState } from '../_utils/outreach-types';

// Temporary, in-memory store shared by every Community Outreach route. It lives
// for the browser tab's lifetime (client-side navigation keeps it, a refresh
// resets it to the seed) until the Outreach API replaces it.
let state: OutreachState = SEED_STATE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function dispatch(action: OutreachAction) {
  state = outreachReducer(state, action);
  listeners.forEach((listener) => listener());
}

export function useOutreach() {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => SEED_STATE
  );
  const send = useCallback((action: OutreachAction) => dispatch(action), []);

  return { state: current, dispatch: send };
}
