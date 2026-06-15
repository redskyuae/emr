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

export type IamSignIn = {
  id: string;
  userId: string;
  device: string;
  when: string;
};

export type IamRoleDistribution = {
  role: string;
  count: number;
  tone: 'primary' | 'chart2' | 'chart4' | 'chart5' | 'destructive';
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
