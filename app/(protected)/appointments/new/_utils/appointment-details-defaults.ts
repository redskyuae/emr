type AppointmentDetailOption = {
  id: number | string;
  code: string;
};

type AppointmentDetails = {
  appointmentModeId: string;
  appointmentTypeId: string;
  appointmentReasonId: string;
};

type AppointmentDetailsOptions = {
  modes: AppointmentDetailOption[];
  types: AppointmentDetailOption[];
  reasons: AppointmentDetailOption[];
};

const defaultAppointmentDetailCodes = {
  mode: 'INP',
  type: 'NEW',
  reason: 'CONS',
} as const;

function getDefaultOptionId(
  options: AppointmentDetailOption[],
  currentId: string,
  preferredCode: string
) {
  if (options.some((option) => String(option.id) === currentId)) return currentId;

  const preferredOption = options.find(
    (option) => option.code.trim().toUpperCase() === preferredCode
  );

  return String(preferredOption?.id ?? options[0]?.id ?? '');
}

export function getAppointmentDetailsDefaults(
  current: AppointmentDetails,
  options: AppointmentDetailsOptions
): AppointmentDetails {
  return {
    appointmentModeId: getDefaultOptionId(
      options.modes,
      current.appointmentModeId,
      defaultAppointmentDetailCodes.mode
    ),
    appointmentTypeId: getDefaultOptionId(
      options.types,
      current.appointmentTypeId,
      defaultAppointmentDetailCodes.type
    ),
    appointmentReasonId: getDefaultOptionId(
      options.reasons,
      current.appointmentReasonId,
      defaultAppointmentDetailCodes.reason
    ),
  };
}
