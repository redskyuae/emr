import { Clock, FileClock, Mail, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react';

export type IamStat = {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'steady';
  note: string;
  icon: LucideIcon;
};

export type IamStaffUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
};

export type IamUserStatus = 'Active' | 'Suspended' | 'Invited';

export type IamDirectoryUser = IamStaffUser & {
  department: string;
  status: IamUserStatus;
  mfaEnabled: boolean;
  lastSignIn: string;
  sessions: number;
};

export type IamSignIn = {
  id: string;
  userId: string;
  device: string;
  when: string;
};

export type IamSession = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  isCurrent: boolean;
  device: string;
  ipAddress: string;
  location: string;
  started: string;
  expires: string;
};

export type IamRoleDistribution = {
  role: string;
  count: number;
  tone: 'primary' | 'chart2' | 'chart4' | 'chart5' | 'destructive';
};

export type IamRoleKind = 'System' | 'Custom';

export type IamRoleIcon = 'crown' | 'shield' | 'stethoscope' | 'heart' | 'receipt' | 'clipboard';

export type IamPermissionAction = {
  id: string;
  label: string;
};

export type IamPermissionResource = {
  id: string;
  name: string;
  actions: IamPermissionAction[];
};

export type IamPermissionSection = {
  id: string;
  name: 'Clinical' | 'Operations' | 'Administration';
  resources: IamPermissionResource[];
};

export type IamRole = {
  id: string;
  name: string;
  kind: IamRoleKind;
  description: string;
  userCount: number;
  assignedUserIds: string[];
  icon: IamRoleIcon;
  tone: 'primary' | 'chart2' | 'chart4' | 'chart5' | 'destructive';
  grantedPermissionIds: string[];
};

export type IamAuditEvent = {
  id: string;
  when: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  type: 'CREATE' | 'MODIFY' | 'AUTH' | 'SECURITY';
};

export const iamStats: IamStat[] = [
  {
    label: 'Total users',
    value: '128',
    delta: '+12',
    trend: 'up',
    note: 'vs last month',
    icon: UsersRound,
  },
  {
    label: 'Active sessions',
    value: '34',
    delta: 'Live',
    trend: 'steady',
    note: 'right now',
    icon: FileClock,
  },
  {
    label: 'Roles defined',
    value: '9',
    delta: '3 system',
    trend: 'steady',
    note: '6 custom Roles',
    icon: ShieldCheck,
  },
  {
    label: 'Pending invites',
    value: '7',
    delta: '+3',
    trend: 'up',
    note: 'awaiting sign-up',
    icon: Mail,
  },
];

export const iamStaffUsers: IamStaffUser[] = [
  {
    id: 'staff-rana-adnan',
    name: 'Rana Adnan',
    email: 'rana.adnan@northgate.example',
    initials: 'RA',
    role: 'Tenant Admin',
  },
  {
    id: 'staff-imran-khan',
    name: 'Dr. Imran Khan',
    email: 'imran.khan@northgate.example',
    initials: 'IK',
    role: 'Attending Physician',
  },
  {
    id: 'staff-sara-ali',
    name: 'Dr. Sara Ali',
    email: 'sara.ali@northgate.example',
    initials: 'SA',
    role: 'Attending Physician',
  },
  {
    id: 'staff-priya-menon',
    name: 'Priya Menon',
    email: 'priya.menon@northgate.example',
    initials: 'PM',
    role: 'Receptionist',
  },
  {
    id: 'staff-waleed-chen',
    name: 'Waleed Chen',
    email: 'waleed.chen@northgate.example',
    initials: 'WC',
    role: 'Nurse',
  },
];

export const iamDirectoryRoleOptions = [
  'Tenant Admin',
  'Attending Physician',
  'Nurse',
  'Receptionist',
  'Billing Officer',
  'Lab Technician',
];

export const iamDirectoryDepartmentOptions = [
  'Administration',
  'Cardiology',
  'Emergency',
  'Front Desk',
  'Billing',
  'Laboratory',
];

export const iamDirectoryUsers: IamDirectoryUser[] = [
  {
    id: 'staff-rana-adnan',
    name: 'Rana Adnan',
    email: 'rana.adnan@northgate.example',
    initials: 'RA',
    role: 'Tenant Admin',
    department: 'Administration',
    status: 'Active',
    mfaEnabled: true,
    lastSignIn: 'Today, 09:55',
    sessions: 3,
  },
  {
    id: 'staff-imran-khan',
    name: 'Dr. Imran Khan',
    email: 'imran.khan@northgate.example',
    initials: 'IK',
    role: 'Attending Physician',
    department: 'Cardiology',
    status: 'Active',
    mfaEnabled: true,
    lastSignIn: 'Today, 09:48',
    sessions: 2,
  },
  {
    id: 'staff-sara-ali',
    name: 'Dr. Sara Ali',
    email: 'sara.ali@northgate.example',
    initials: 'SA',
    role: 'Attending Physician',
    department: 'Emergency',
    status: 'Active',
    mfaEnabled: true,
    lastSignIn: 'Today, 09:32',
    sessions: 1,
  },
  {
    id: 'staff-priya-menon',
    name: 'Priya Menon',
    email: 'priya.menon@northgate.example',
    initials: 'PM',
    role: 'Receptionist',
    department: 'Front Desk',
    status: 'Suspended',
    mfaEnabled: false,
    lastSignIn: 'Yesterday, 17:44',
    sessions: 0,
  },
  {
    id: 'staff-waleed-chen',
    name: 'Waleed Chen',
    email: 'waleed.chen@northgate.example',
    initials: 'WC',
    role: 'Nurse',
    department: 'Emergency',
    status: 'Invited',
    mfaEnabled: false,
    lastSignIn: '—',
    sessions: 0,
  },
  {
    id: 'staff-farah-nasser',
    name: 'Farah Nasser',
    email: 'farah.nasser@northgate.example',
    initials: 'FN',
    role: 'Billing Officer',
    department: 'Billing',
    status: 'Active',
    mfaEnabled: true,
    lastSignIn: 'Today, 08:16',
    sessions: 1,
  },
  {
    id: 'staff-lina-mathew',
    name: 'Lina Mathew',
    email: 'lina.mathew@northgate.example',
    initials: 'LM',
    role: 'Lab Technician',
    department: 'Laboratory',
    status: 'Invited',
    mfaEnabled: false,
    lastSignIn: '—',
    sessions: 0,
  },
];

export const iamRecentSignIns: IamSignIn[] = [
  {
    id: 'signin-001',
    userId: 'staff-rana-adnan',
    device: 'Chrome on Windows 11',
    when: 'Today, 09:55',
  },
  {
    id: 'signin-002',
    userId: 'staff-imran-khan',
    device: 'iOS app on iPhone 15',
    when: 'Today, 09:48',
  },
  {
    id: 'signin-003',
    userId: 'staff-sara-ali',
    device: 'Safari on iPad Pro',
    when: 'Today, 09:32',
  },
  {
    id: 'signin-004',
    userId: 'staff-priya-menon',
    device: 'Chrome on Windows 11',
    when: 'Today, 09:18',
  },
  {
    id: 'signin-005',
    userId: 'staff-waleed-chen',
    device: 'Edge on Nursing station',
    when: 'Today, 08:46',
  },
];

export const iamActiveSessions: IamSession[] = [
  {
    id: 'session-001',
    userId: 'staff-rana-adnan',
    userName: 'Rana Adnan',
    userEmail: 'rana.adnan@northgate.example',
    userInitials: 'RA',
    isCurrent: true,
    device: 'Chrome on Windows 11',
    ipAddress: '10.24.18.42',
    location: 'Dubai, UAE',
    started: 'Today, 09:55',
    expires: 'Today, 17:55',
  },
  {
    id: 'session-002',
    userId: 'staff-rana-adnan',
    userName: 'Rana Adnan',
    userEmail: 'rana.adnan@northgate.example',
    userInitials: 'RA',
    isCurrent: false,
    device: 'Safari on iPad Pro',
    ipAddress: '10.24.21.88',
    location: 'Northgate General',
    started: 'Today, 08:22',
    expires: 'Today, 16:22',
  },
  {
    id: 'session-003',
    userId: 'staff-imran-khan',
    userName: 'Dr. Imran Khan',
    userEmail: 'imran.khan@northgate.example',
    userInitials: 'IK',
    isCurrent: false,
    device: 'iOS app on iPhone 15',
    ipAddress: '10.24.32.104',
    location: 'Dubai, UAE',
    started: 'Today, 09:48',
    expires: 'Today, 17:48',
  },
  {
    id: 'session-004',
    userId: 'staff-sara-ali',
    userName: 'Dr. Sara Ali',
    userEmail: 'sara.ali@northgate.example',
    userInitials: 'SA',
    isCurrent: false,
    device: 'Safari on iPad Pro',
    ipAddress: '10.24.44.19',
    location: 'Emergency Ward',
    started: 'Today, 09:32',
    expires: 'Today, 17:32',
  },
  {
    id: 'session-005',
    userId: 'staff-farah-nasser',
    userName: 'Farah Nasser',
    userEmail: 'farah.nasser@northgate.example',
    userInitials: 'FN',
    isCurrent: false,
    device: 'Edge on Windows 11',
    ipAddress: '10.24.52.73',
    location: 'Billing Office',
    started: 'Today, 08:16',
    expires: 'Today, 16:16',
  },
  {
    id: 'session-006',
    userId: 'staff-priya-menon',
    userName: 'Priya Menon',
    userEmail: 'priya.menon@northgate.example',
    userInitials: 'PM',
    isCurrent: false,
    device: 'Chrome on Windows 11',
    ipAddress: '10.24.61.12',
    location: 'Front Desk',
    started: 'Today, 07:58',
    expires: 'Today, 15:58',
  },
];

export const iamRoleDistribution: IamRoleDistribution[] = [
  { role: 'Tenant Admin', count: 4, tone: 'destructive' },
  { role: 'Attending Physician', count: 42, tone: 'chart4' },
  { role: 'Nurse', count: 36, tone: 'primary' },
  { role: 'Billing Officer', count: 15, tone: 'chart5' },
  { role: 'Receptionist', count: 18, tone: 'chart2' },
  { role: 'Lab Technician', count: 13, tone: 'chart4' },
];

export const iamRecentAuditEvents: IamAuditEvent[] = [
  {
    id: 'audit-001',
    when: 'Today, 09:55',
    actor: 'Rana Adnan',
    action: 'user.invite',
    target: 'waleed.chen@northgate.example',
    details: 'Invited as Nurse for Emergency',
    type: 'CREATE',
  },
  {
    id: 'audit-002',
    when: 'Today, 09:42',
    actor: 'Rana Adnan',
    action: 'role.edit',
    target: 'Nurse',
    details: 'Added Pharmacy:Dispense permission',
    type: 'MODIFY',
  },
  {
    id: 'audit-003',
    when: 'Today, 09:32',
    actor: 'Dr. Sara Ali',
    action: 'auth.signin',
    target: 'Self',
    details: 'Password and TOTP accepted from iPad Pro',
    type: 'AUTH',
  },
  {
    id: 'audit-004',
    when: 'Today, 08:58',
    actor: 'System',
    action: 'session.revoke',
    target: 'Former contractor',
    details: 'Expired external Staff session revoked',
    type: 'SECURITY',
  },
];

export const iamDashboardLoadedAt = {
  label: 'Mock data refreshed',
  value: 'Today, 10:00',
  icon: Clock,
};

export const iamPermissionSections: IamPermissionSection[] = [
  {
    id: 'clinical',
    name: 'Clinical',
    resources: [
      {
        id: 'patients',
        name: 'Patients',
        actions: [
          { id: 'view-list', label: 'View list' },
          { id: 'view-records', label: 'View records' },
          { id: 'edit-records', label: 'Edit records' },
          { id: 'delete', label: 'Delete' },
          { id: 'export', label: 'Export' },
        ],
      },
      {
        id: 'appointments',
        name: 'Appointments',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'create', label: 'Create' },
          { id: 'edit', label: 'Edit' },
          { id: 'cancel', label: 'Cancel' },
        ],
      },
      {
        id: 'labs',
        name: 'Labs',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'request', label: 'Request' },
          { id: 'approve', label: 'Approve' },
          { id: 'export', label: 'Export' },
        ],
      },
      {
        id: 'pharmacy',
        name: 'Pharmacy',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'prescribe', label: 'Prescribe' },
          { id: 'dispense', label: 'Dispense' },
        ],
      },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    resources: [
      {
        id: 'beds-wards',
        name: 'Beds & Wards',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'manage', label: 'Manage' },
        ],
      },
      {
        id: 'billing',
        name: 'Billing',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'create-invoices', label: 'Create invoices' },
          { id: 'void', label: 'Void' },
          { id: 'approve', label: 'Approve' },
        ],
      },
      {
        id: 'reports',
        name: 'Reports',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'export', label: 'Export' },
        ],
      },
      {
        id: 'departments',
        name: 'Departments',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'manage', label: 'Manage' },
        ],
      },
    ],
  },
  {
    id: 'administration',
    name: 'Administration',
    resources: [
      {
        id: 'users',
        name: 'Users',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'invite', label: 'Invite' },
          { id: 'edit', label: 'Edit' },
          { id: 'suspend', label: 'Suspend' },
          { id: 'delete', label: 'Delete' },
        ],
      },
      {
        id: 'roles',
        name: 'Roles',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'create', label: 'Create' },
          { id: 'edit', label: 'Edit' },
          { id: 'delete', label: 'Delete' },
        ],
      },
      {
        id: 'sessions',
        name: 'Sessions',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'revoke', label: 'Revoke' },
        ],
      },
      {
        id: 'audit-log',
        name: 'Audit Log',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'export', label: 'Export' },
        ],
      },
      {
        id: 'tenant-profile',
        name: 'Tenant Profile',
        actions: [
          { id: 'view', label: 'View' },
          { id: 'edit', label: 'Edit' },
        ],
      },
    ],
  },
];

export function iamPermissionId(sectionId: string, resourceId: string, actionId: string) {
  return `${sectionId}:${resourceId}:${actionId}`;
}

const allPermissionIds = iamPermissionSections.flatMap((section) =>
  section.resources.flatMap((resource) =>
    resource.actions.map((action) => iamPermissionId(section.id, resource.id, action.id))
  )
);

const permissionIdsBySection = new Map(
  iamPermissionSections.map((section) => [
    section.id,
    section.resources.flatMap((resource) =>
      resource.actions.map((action) => iamPermissionId(section.id, resource.id, action.id))
    ),
  ])
);

const permissionIdsByResource = new Map(
  iamPermissionSections.flatMap((section) =>
    section.resources.map((resource) => [
      `${section.id}:${resource.id}`,
      resource.actions.map((action) => iamPermissionId(section.id, resource.id, action.id)),
    ])
  )
);

function permissionIdsForSection(sectionId: string, limit?: number) {
  const ids = permissionIdsBySection.get(sectionId) ?? [];
  return typeof limit === 'number' ? ids.slice(0, limit) : ids;
}

function permissionIdsForResource(sectionId: string, resourceId: string, limit?: number) {
  const ids = permissionIdsByResource.get(`${sectionId}:${resourceId}`) ?? [];
  return typeof limit === 'number' ? ids.slice(0, limit) : ids;
}

export const iamRoles: IamRole[] = [
  {
    id: 'role-tenant-owner',
    name: 'Tenant Owner',
    kind: 'System',
    description: 'Unrestricted Tenant administration, Role setup, and system configuration.',
    userCount: 1,
    assignedUserIds: ['staff-rana-adnan'],
    icon: 'crown',
    tone: 'destructive',
    grantedPermissionIds: allPermissionIds,
  },
  {
    id: 'role-tenant-admin',
    name: 'Tenant Admin',
    kind: 'System',
    description: 'Manage Staff, Facility settings, reports, and user onboarding.',
    userCount: 2,
    assignedUserIds: ['staff-rana-adnan', 'staff-priya-menon'],
    icon: 'shield',
    tone: 'primary',
    grantedPermissionIds: [
      ...permissionIdsForSection('operations'),
      ...permissionIdsForSection('administration'),
      ...permissionIdsForResource('clinical', 'patients', 2),
      iamPermissionId('clinical', 'appointments', 'view'),
    ],
  },
  {
    id: 'role-attending-physician',
    name: 'Attending Physician',
    kind: 'System',
    description: 'Full clinical access for Patient records, lab orders, and prescriptions.',
    userCount: 4,
    assignedUserIds: ['staff-imran-khan', 'staff-sara-ali'],
    icon: 'stethoscope',
    tone: 'chart4',
    grantedPermissionIds: [
      ...permissionIdsForSection('clinical'),
      iamPermissionId('operations', 'reports', 'view'),
      iamPermissionId('administration', 'sessions', 'view'),
    ],
  },
  {
    id: 'role-nurse',
    name: 'Nurse',
    kind: 'Custom',
    description: 'Patient vitals, nursing notes, ward assignments, and medication admin.',
    userCount: 6,
    assignedUserIds: ['staff-waleed-chen', 'staff-lina-mathew', 'staff-farah-nasser'],
    icon: 'heart',
    tone: 'chart2',
    grantedPermissionIds: [
      ...permissionIdsForResource('clinical', 'patients', 3),
      iamPermissionId('clinical', 'appointments', 'view'),
      iamPermissionId('clinical', 'labs', 'view'),
      iamPermissionId('clinical', 'labs', 'request'),
      iamPermissionId('clinical', 'pharmacy', 'view'),
      iamPermissionId('clinical', 'pharmacy', 'dispense'),
      ...permissionIdsForResource('operations', 'beds-wards'),
      iamPermissionId('operations', 'reports', 'view'),
    ],
  },
  {
    id: 'role-billing-officer',
    name: 'Billing Officer',
    kind: 'Custom',
    description: 'Insurance claims, invoicing, financial reports, and co-pay collection.',
    userCount: 3,
    assignedUserIds: ['staff-farah-nasser'],
    icon: 'receipt',
    tone: 'chart5',
    grantedPermissionIds: [
      ...permissionIdsForResource('operations', 'billing'),
      ...permissionIdsForResource('operations', 'reports'),
      iamPermissionId('clinical', 'patients', 'view-list'),
      iamPermissionId('clinical', 'patients', 'view-records'),
      iamPermissionId('clinical', 'appointments', 'view'),
    ],
  },
  {
    id: 'role-receptionist',
    name: 'Receptionist',
    kind: 'Custom',
    description: 'Front-desk tasks for Patient check-in, appointments, and scheduling.',
    userCount: 5,
    assignedUserIds: ['staff-priya-menon'],
    icon: 'clipboard',
    tone: 'chart4',
    grantedPermissionIds: [
      iamPermissionId('clinical', 'patients', 'view-list'),
      iamPermissionId('clinical', 'patients', 'view-records'),
      iamPermissionId('clinical', 'appointments', 'view'),
      iamPermissionId('clinical', 'appointments', 'create'),
      iamPermissionId('clinical', 'appointments', 'edit'),
      iamPermissionId('administration', 'users', 'view'),
      iamPermissionId('administration', 'sessions', 'view'),
    ],
  },
];
