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
