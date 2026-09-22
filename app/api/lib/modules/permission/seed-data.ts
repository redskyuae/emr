export type PermissionSeed = {
  name: string;
  action: string;
  module: string;
  resource: string;
  description: string;
};

type PermissionGroup = {
  module: string;
  resource: string;
  actions: readonly (readonly [action: string, description: string])[];
};

const permissionGroups = [
  {
    module: 'tenant-management',
    resource: 'tenant',
    actions: [
      ['read', 'View Tenant profile details.'],
      ['update', 'Update Tenant display details.'],
      ['deactivate', 'Deactivate the Tenant.'],
      ['reactivate', 'Reactivate the Tenant.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'staff',
    actions: [
      ['read', 'View Staff profiles.'],
      ['create', 'Create Staff accounts.'],
      ['update', 'Update Staff profile details.'],
      ['deactivate', 'Deactivate Staff access.'],
      ['reactivate', 'Reactivate Staff access.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'doctor',
    actions: [
      ['read', 'View Doctors.'],
      ['create', 'Create Doctors.'],
      ['update', 'Update Doctor details.'],
      ['deactivate', 'Deactivate Doctor access.'],
      ['reactivate', 'Reactivate Doctor access.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'therapist',
    actions: [
      ['read', 'View Therapists.'],
      ['create', 'Create Therapists.'],
      ['update', 'Update Therapist details.'],
      ['deactivate', 'Deactivate Therapist access.'],
      ['reactivate', 'Reactivate Therapist access.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'role',
    actions: [
      ['read', 'View Roles.'],
      ['create', 'Create Roles.'],
      ['update', 'Update Role details.'],
      ['delete', 'Delete Roles without active assignments.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'permission-catalogue',
    actions: [['read', 'View the Permission Catalogue.']],
  },
  {
    module: 'identity-access',
    resource: 'permission-assignment',
    actions: [
      ['read', 'View Permission Assignments for Roles.'],
      ['assign', 'Add Permission Assignments to Roles.'],
      ['replace', 'Replace all Permission Assignments for a Role.'],
      ['remove', 'Remove Permission Assignments from Roles.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'role-assignment',
    actions: [
      ['read', 'View Role Assignments for Staff.'],
      ['assign', 'Assign Roles to Staff.'],
      ['remove', 'Remove Roles from Staff.'],
    ],
  },
  {
    module: 'identity-access',
    resource: 'session',
    actions: [
      ['read', 'View active Sessions.'],
      ['revoke', 'Revoke active Sessions.'],
    ],
  },
  {
    module: 'doctor-scheduling',
    resource: 'doctor-rota',
    actions: [
      ['read', 'View Doctor Rotas.'],
      ['create', 'Create Doctor Rotas.'],
      ['update', 'Update Doctor Rota details.'],
      ['delete', 'Delete Doctor Rotas.'],
    ],
  },
  {
    module: 'doctor-scheduling',
    resource: 'doctor-schedule',
    actions: [
      ['read', 'View Doctor Schedules.'],
      ['create', 'Create Doctor Schedules.'],
      ['update', 'Update Doctor Schedule details.'],
    ],
  },
  {
    module: 'clinical-masters',
    resource: 'specialty',
    actions: [
      ['read', 'View Specialties.'],
      ['create', 'Create Specialties.'],
      ['update', 'Update Specialties.'],
      ['delete', 'Delete Specialties.'],
    ],
  },
  {
    module: 'clinical-masters',
    resource: 'therapist-skill',
    actions: [
      ['read', 'View Therapist Skills.'],
      ['create', 'Create Therapist Skills.'],
      ['update', 'Update Therapist Skills.'],
      ['delete', 'Delete Therapist Skills.'],
    ],
  },
  {
    module: 'patient-management',
    resource: 'patient',
    actions: [
      ['read', 'View Patients.'],
      ['create', 'Register Patients.'],
      ['update', 'Update Patient details.'],
      ['delete', 'Delete Patients.'],
      ['deactivate', 'Deactivate Patients.'],
      ['reactivate', 'Reactivate Patients.'],
    ],
  },
  {
    module: 'appointments',
    resource: 'appointment',
    actions: [
      ['read', 'View Appointments.'],
      ['create', 'Book Appointments.'],
      ['reassign-therapist', 'Reassign Therapists on Procedure Appointments.'],
    ],
  },
  {
    module: 'appointment-masters',
    resource: 'appointment-mode',
    actions: [
      ['read', 'View Appointment Modes.'],
      ['create', 'Create Appointment Modes.'],
      ['update', 'Update Appointment Modes.'],
      ['delete', 'Delete Appointment Modes.'],
    ],
  },
  {
    module: 'appointment-masters',
    resource: 'appointment-type',
    actions: [
      ['read', 'View Appointment Types.'],
      ['create', 'Create Appointment Types.'],
      ['update', 'Update Appointment Types.'],
      ['delete', 'Delete Appointment Types.'],
    ],
  },
  {
    module: 'appointment-masters',
    resource: 'appointment-status',
    actions: [
      ['read', 'View Appointment Statuses.'],
      ['create', 'Create Appointment Statuses.'],
      ['update', 'Update Appointment Statuses.'],
      ['delete', 'Delete Appointment Statuses.'],
    ],
  },
  {
    module: 'appointment-masters',
    resource: 'appointment-reason',
    actions: [
      ['read', 'View Appointment Reasons.'],
      ['create', 'Create Appointment Reasons.'],
      ['update', 'Update Appointment Reasons.'],
      ['delete', 'Delete Appointment Reasons.'],
    ],
  },
  {
    module: 'appointment-masters',
    resource: 'appointment-cancelled-reason',
    actions: [
      ['read', 'View Appointment Cancelled Reasons.'],
      ['create', 'Create Appointment Cancelled Reasons.'],
      ['update', 'Update Appointment Cancelled Reasons.'],
      ['delete', 'Delete Appointment Cancelled Reasons.'],
    ],
  },
  {
    module: 'global-references',
    resource: 'language',
    actions: [
      ['read', 'View Languages.'],
      ['create', 'Create Languages.'],
      ['update', 'Update Languages.'],
      ['delete', 'Delete Languages.'],
    ],
  },
  {
    module: 'global-references',
    resource: 'nationality',
    actions: [
      ['read', 'View Nationalities.'],
      ['create', 'Create Nationalities.'],
      ['update', 'Update Nationalities.'],
      ['delete', 'Delete Nationalities.'],
    ],
  },
  {
    module: 'global-references',
    resource: 'religion',
    actions: [
      ['read', 'View Religions.'],
      ['create', 'Create Religions.'],
      ['update', 'Update Religions.'],
      ['delete', 'Delete Religions.'],
    ],
  },
  {
    module: 'global-references',
    resource: 'country',
    actions: [
      ['read', 'View Countries.'],
      ['create', 'Create Countries.'],
      ['update', 'Update Countries.'],
      ['delete', 'Delete Countries.'],
    ],
  },
  {
    module: 'global-references',
    resource: 'state',
    actions: [
      ['read', 'View States.'],
      ['create', 'Create States.'],
      ['update', 'Update States.'],
      ['delete', 'Delete States.'],
    ],
  },
  {
    module: 'clinical-masters',
    resource: 'diagnosis-code',
    actions: [
      ['read', 'View Diagnosis Codes.'],
      ['create', 'Create Diagnosis Codes.'],
      ['update', 'Update Diagnosis Codes.'],
      ['delete', 'Delete Diagnosis Codes.'],
    ],
  },
  {
    module: 'clinical-masters',
    resource: 'allergen',
    actions: [
      ['read', 'View Allergens.'],
      ['create', 'Create Allergens.'],
      ['update', 'Update Allergens.'],
      ['delete', 'Delete Allergens.'],
    ],
  },
  {
    module: 'clinical-masters',
    resource: 'clinical-note-type',
    actions: [
      ['read', 'View Clinical Note Types.'],
      ['create', 'Create Clinical Note Types.'],
      ['update', 'Update Clinical Note Types.'],
      ['delete', 'Delete Clinical Note Types.'],
    ],
  },
  {
    module: 'clinical-records',
    resource: 'allergy',
    actions: [
      ['read', 'View Patient Allergies.'],
      ['create', 'Create Patient Allergies.'],
      ['update', 'Update Patient Allergies.'],
      ['delete', 'Delete Patient Allergies.'],
    ],
  },
  {
    module: 'clinical-records',
    resource: 'problem',
    actions: [
      ['read', 'View Patient Problems.'],
      ['create', 'Create Patient Problems.'],
      ['update', 'Update Patient Problems.'],
      ['delete', 'Delete Patient Problems.'],
    ],
  },
  {
    module: 'clinical-records',
    resource: 'vital-sign',
    actions: [
      ['read', 'View Patient Vital Signs.'],
      ['create', 'Create Patient Vital Signs.'],
      ['update', 'Update Patient Vital Signs.'],
      ['delete', 'Delete Patient Vital Signs.'],
    ],
  },
  {
    module: 'clinical-records',
    resource: 'medication',
    actions: [
      ['read', 'View Patient Medications.'],
      ['create', 'Create Patient Medications.'],
      ['update', 'Update Patient Medications.'],
      ['delete', 'Delete Patient Medications.'],
    ],
  },
  {
    module: 'clinical-records',
    resource: 'clinical-note',
    actions: [
      ['read', 'View Clinical Notes.'],
      ['create', 'Create Clinical Notes.'],
      ['update', 'Update Clinical Notes.'],
      ['delete', 'Delete Clinical Notes.'],
      ['sign', 'Sign Clinical Notes.'],
    ],
  },
  {
    module: 'visits',
    resource: 'treatment',
    actions: [
      ['read', 'View Treatments and their Sessions.'],
      ['create', 'Create Treatments and Sessions.'],
      ['update', 'Update Treatment details.'],
      ['delete', 'Delete Treatments.'],
    ],
  },
  {
    module: 'visits',
    resource: 'visit-type',
    actions: [
      ['read', 'View VisitTypes.'],
      ['create', 'Create VisitTypes.'],
      ['update', 'Update VisitTypes.'],
      ['delete', 'Delete VisitTypes.'],
    ],
  },
  {
    module: 'visits',
    resource: 'visit',
    actions: [
      ['read', 'View Visits.'],
      ['create', 'Check Patients in for Visits.'],
      ['update', 'Update Visit details.'],
      ['delete', 'Delete Visits.'],
      ['start', 'Start the consultation for a Visit.'],
      ['complete', 'Complete a Visit.'],
      ['cancel', 'Cancel a Visit.'],
    ],
  },
  {
    module: 'room-masters',
    resource: 'room-type',
    actions: [
      ['read', 'View Room Types.'],
      ['create', 'Create Room Types.'],
      ['update', 'Update Room Type details.'],
      ['delete', 'Delete Room Types.'],
    ],
  },
  {
    module: 'room-management',
    resource: 'room',
    actions: [
      ['read', 'View Rooms.'],
      ['create', 'Create Rooms.'],
      ['update', 'Update Room details.'],
      ['delete', 'Delete Rooms.'],
    ],
  },
  {
    module: 'inpatient-masters',
    resource: 'ward',
    actions: [
      ['read', 'View Wards.'],
      ['create', 'Create Wards.'],
      ['update', 'Update Wards.'],
      ['delete', 'Delete Wards without assigned Beds.'],
    ],
  },
  {
    module: 'inpatient-masters',
    resource: 'bed',
    actions: [
      ['read', 'View Beds.'],
      ['create', 'Create Beds.'],
      ['update', 'Update Beds.'],
      ['delete', 'Delete unoccupied Beds.'],
    ],
  },
  {
    module: 'inpatient-masters',
    resource: 'admission-type',
    actions: [
      ['read', 'View AdmissionTypes.'],
      ['create', 'Create AdmissionTypes.'],
      ['update', 'Update AdmissionTypes.'],
      ['delete', 'Delete AdmissionTypes.'],
    ],
  },
  {
    module: 'inpatient',
    resource: 'admission',
    actions: [
      ['read', 'View Admissions.'],
      ['create', 'Admit Patients.'],
      ['update', 'Update Admission details.'],
      ['delete', 'Delete Admissions.'],
      ['transfer', 'Transfer an Admission to another Bed.'],
      ['discharge', 'Discharge an Admission.'],
      ['cancel', 'Cancel an Admission.'],
    ],
  },
  {
    module: 'asset-management',
    resource: 'asset',
    actions: [
      ['read', 'View Assets.'],
      ['create', 'Create Assets.'],
      ['update', 'Update Asset details.'],
      ['delete', 'Delete Assets.'],
    ],
  },
  {
    module: 'asset-management',
    resource: 'work-order',
    actions: [
      ['read', 'View Work Orders.'],
      ['create', 'Create Work Orders.'],
    ],
  },
  {
    module: 'asset-management-masters',
    resource: 'asset-category',
    actions: [
      ['read', 'View Asset Categories.'],
      ['create', 'Create Asset Categories.'],
      ['update', 'Update Asset Category details.'],
      ['delete', 'Delete Asset Categories.'],
    ],
  },
  {
    module: 'asset-management-masters',
    resource: 'asset-condition',
    actions: [
      ['read', 'View Asset Conditions.'],
      ['create', 'Create Asset Conditions.'],
      ['update', 'Update Asset Condition details.'],
      ['delete', 'Delete Asset Conditions.'],
    ],
  },
  {
    module: 'asset-management-masters',
    resource: 'asset-status',
    actions: [
      ['read', 'View Asset Statuses.'],
      ['create', 'Create Asset Statuses.'],
      ['update', 'Update Asset Status details.'],
      ['delete', 'Delete Asset Statuses.'],
    ],
  },
  {
    module: 'asset-management-masters',
    resource: 'work-order-type',
    actions: [
      ['read', 'View Work Order Types.'],
      ['create', 'Create Work Order Types.'],
      ['update', 'Update Work Order Type details.'],
      ['delete', 'Delete Work Order Types.'],
    ],
  },
  {
    module: 'asset-management-masters',
    resource: 'work-order-priority',
    actions: [
      ['read', 'View Work Order Priorities.'],
      ['create', 'Create Work Order Priorities.'],
      ['update', 'Update Work Order Priority details.'],
      ['delete', 'Delete Work Order Priorities.'],
    ],
  },
  {
    module: 'asset-management-masters',
    resource: 'work-order-status',
    actions: [
      ['read', 'View Work Order Statuses.'],
      ['create', 'Create Work Order Statuses.'],
      ['update', 'Update Work Order Status details.'],
      ['delete', 'Delete Work Order Statuses.'],
    ],
  },
  {
    module: 'billing-masters',
    resource: 'charge-item',
    actions: [
      ['read', 'View Charge Items.'],
      ['create', 'Create Charge Items.'],
      ['update', 'Update Charge Items.'],
      ['delete', 'Delete Charge Items.'],
    ],
  },
  {
    module: 'billing',
    resource: 'invoice',
    actions: [
      ['read', 'View Invoices.'],
      ['create', 'Create Invoices.'],
      ['update', 'Update Draft Invoice details.'],
      ['delete', 'Delete Draft or Void Invoices.'],
      ['finalize', 'Finalize a Draft Invoice.'],
      ['void', 'Void an Invoice without Payments.'],
      ['generate-charges', 'Generate Bed-Day Charges for an Admission Invoice.'],
    ],
  },
  {
    module: 'billing',
    resource: 'payment',
    actions: [
      ['read', 'View Payments recorded against Invoices.'],
      ['record', 'Record Payments against Invoices.'],
    ],
  },
] satisfies PermissionGroup[];

export const permissionSeedData: PermissionSeed[] = permissionGroups.flatMap((group) =>
  group.actions.map(([action, description]) => ({
    module: group.module,
    resource: group.resource,
    action,
    name: `${group.resource}:${action}`,
    description,
  }))
);

export const permissionSeedOrder = new Map(
  permissionSeedData.map((permission, index) => [permission.name, index])
);
