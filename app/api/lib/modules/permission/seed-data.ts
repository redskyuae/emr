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
