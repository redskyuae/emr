import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import type { CreateVisitFormValues } from '../_utils/create-visit-form-schema';
import { getAppointmentVisitDefaults } from '../_utils/appointment-visit-defaults';

export function useAppointmentVisitPrefill({
  form,
  selectedAppointmentId,
  initialAppointmentId,
  initialAppointment,
  visitTypes,
}: {
  form: UseFormReturn<CreateVisitFormValues>;
  selectedAppointmentId: string;
  initialAppointmentId: number | null;
  initialAppointment: Appointment | undefined;
  visitTypes: VisitType[];
}) {
  const { getFieldState, setValue } = form;

  useEffect(() => {
    if (
      !initialAppointment ||
      initialAppointmentId === null ||
      selectedAppointmentId !== String(initialAppointmentId) ||
      !visitTypes.length
    ) {
      return;
    }

    const defaults = getAppointmentVisitDefaults(initialAppointment, visitTypes);
    for (const field of ['visitTypeId', 'chiefComplaint', 'remarks'] as const) {
      if (!getFieldState(field).isDirty) {
        setValue(field, defaults[field]);
      }
    }
  }, [
    getFieldState,
    initialAppointment,
    initialAppointmentId,
    setValue,
    selectedAppointmentId,
    visitTypes,
  ]);
}
