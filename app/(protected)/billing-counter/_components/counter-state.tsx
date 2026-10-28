'use client';

import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { COUNTER_PATIENTS, createSeedState } from '../_data/counter-seed';
import { counterReducer, type CounterAction } from '../_utils/counter-ledger';
import type { CounterPatient, CounterState } from '../_utils/counter-types';

type CounterContextValue = {
  state: CounterState;
  shiftOpen: boolean;
  dispatch: (action: CounterAction) => void;
  patientByMrn: (mrn: string) => CounterPatient | undefined;
};

const CounterContext = createContext<CounterContextValue | null>(null);

export function CounterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(counterReducer, undefined, createSeedState);

  const value = useMemo<CounterContextValue>(
    () => ({
      state,
      dispatch,
      shiftOpen: state.shift.status === 'OPEN',
      patientByMrn: (mrn) => COUNTER_PATIENTS.find((patient) => patient.mrn === mrn),
    }),
    [state]
  );

  return <CounterContext.Provider value={value}>{children}</CounterContext.Provider>;
}

export function useCounter() {
  const context = useContext(CounterContext);

  if (!context) {
    throw new Error('useCounter must be used inside CounterProvider');
  }

  return context;
}
