import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  FileClock,
  Gauge,
  Globe2,
  Hospital,
  Languages,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldCheck,
  Stethoscope,
  Tag,
  UserRoundCog,
  UsersRound,
  Wrench,
} from 'lucide-react';

export type AppNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  items?: {
    title: string;
    href: string;
    badge?: string;
  }[];
};

export type AppNavGroup = {
  title: string;
  items: AppNavItem[];
};

export type AppPageMeta = {
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    href: string;
  };
};

export const appNavGroups: AppNavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Gauge,
      },
    ],
  },
  {
    title: 'Clinical',
    items: [
      {
        title: 'Patients',
        href: '/patients',
        icon: UsersRound,
      },
      {
        title: 'Appointments',
        href: '/appointments',
        icon: CalendarClock,
      },
      {
        title: 'Visits',
        href: '/visits',
        icon: ClipboardList,
        badge: '404',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Doctors',
        href: '/doctors',
        icon: Stethoscope,
        badge: '404',
      },
    ],
  },
  {
    title: 'Identity & Access',
    items: [
      {
        title: 'Users',
        href: '/identity-access/users',
        icon: UsersRound,
      },
      {
        title: 'Roles & Permissions',
        href: '/identity-access/roles',
        icon: ShieldCheck,
      },
      {
        title: 'Sessions',
        href: '/identity-access/sessions',
        icon: FileClock,
      },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      {
        title: 'Overview',
        href: '/assets-management',
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: 'Inventory',
        href: '/assets-management/inventory',
        icon: Boxes,
      },
      {
        title: 'Maintenance',
        href: '/assets-management/maintenance',
        icon: Wrench,
      },
    ],
  },
  {
    title: 'Activity',
    items: [
      {
        title: 'Audit Log',
        href: '/audit-log',
        icon: Activity,
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        title: 'Tenant Profile',
        href: '/tenant-profile',
        icon: Building2,
      },
      {
        title: 'Appointment Masters',
        href: '/appointment-masters',
        icon: CalendarClock,
        items: [
          { title: 'Mode', href: '/appointment-masters/modes' },
          { title: 'Type', href: '/appointment-masters/types' },
          { title: 'Status', href: '/appointment-masters/statuses' },
          { title: 'Reason', href: '/appointment-masters/reasons' },
          {
            title: 'Cancelled Reason',
            href: '/appointment-masters/cancelled-reasons',
          },
        ],
      },
      {
        title: 'Asset Management',
        href: '/asset-management-masters',
        icon: Tag,
        items: [
          { title: 'Categories', href: '/asset-management-masters/categories' },
          { title: 'Status', href: '/asset-management-masters/statuses' },
        ],
      },
      {
        title: 'Global References',
        href: '/global-references',
        icon: Globe2,
        items: [
          { title: 'Languages', href: '/global-references/languages' },
          { title: 'Nationalities', href: '/global-references/nationalities' },
          { title: 'Religions', href: '/global-references/religions' },
          { title: 'Countries', href: '/global-references/countries' },
          { title: 'States', href: '/global-references/states' },
        ],
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        badge: '404',
      },
    ],
  },
];

const pageMetaByHref: Record<string, AppPageMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Tenant-wide operations for the active Facility context.',
    primaryAction: {
      label: 'New appointment',
      href: '/appointments/new',
    },
  },
  '/patients': {
    title: 'Patients',
    subtitle: 'Patient registry and demographics for this Tenant.',
    primaryAction: {
      label: 'Register patient',
      href: '/patients/new',
    },
  },
  '/patients/new': {
    title: 'Register patient',
    subtitle: 'Capture demographics, contact details, and identifiers for this Tenant.',
  },
  '/appointments': {
    title: 'Appointments',
    subtitle: 'Schedule and track outpatient appointments by Facility.',
    primaryAction: {
      label: 'New appointment',
      href: '/appointments/new',
    },
  },
  '/identity-access/users': {
    title: 'Users',
    subtitle: 'Staff user access within this Tenant.',
    primaryAction: {
      label: 'Add user',
      href: '/identity-access/users?user=new',
    },
  },
  '/identity-access/roles': {
    title: 'Roles & Permissions',
    subtitle: 'Tenant-scoped Roles mapped to the Permission Catalogue.',
  },
  '/identity-access/sessions': {
    title: 'Sessions',
    subtitle: 'Active user sessions and revocation controls.',
  },
  '/assets-management': {
    title: 'Asset Management',
    subtitle: "Equipment estate across this Tenant's Facilities.",
    primaryAction: {
      label: 'Add asset',
      href: '/assets-management/inventory?add=1',
    },
  },
  '/assets-management/inventory': {
    title: 'Asset Inventory',
    subtitle: 'All tracked equipment by category and Facility.',
  },
  '/assets-management/maintenance': {
    title: 'Maintenance & Work Orders',
    subtitle: 'Preventive, corrective, calibration & inspection jobs.',
  },
  '/audit-log': {
    title: 'Audit Log',
    subtitle: 'Identity and access audit activity for this Tenant.',
  },
  '/tenant-profile': {
    title: 'Tenant Profile',
    subtitle: 'Tenant display details and operating status.',
  },
  '/appointment-masters': {
    title: 'Appointment Masters',
    subtitle: 'Tenant-scoped appointment configuration.',
  },
  '/appointment-masters/modes': {
    title: 'Appointment Modes',
    subtitle: 'Tenant-scoped delivery channel or format records for Appointments.',
  },
  '/appointment-masters/types': {
    title: 'Appointment Types',
    subtitle: 'Tenant-scoped clinical category or visit type records for Appointments.',
  },
  '/appointment-masters/statuses': {
    title: 'Appointment Statuses',
    subtitle: 'Tenant-scoped lifecycle state records for Appointments.',
  },
  '/appointment-masters/reasons': {
    title: 'Appointment Reasons',
    subtitle: 'Tenant-scoped booking reason records for Appointments.',
  },
  '/appointment-masters/cancelled-reasons': {
    title: 'Appointment Cancelled Reasons',
    subtitle: 'Tenant-scoped cancellation reason records for Appointments.',
  },
  '/asset-management-masters': {
    title: 'Asset Management',
    subtitle: 'Tenant-scoped Asset classification configuration.',
  },
  '/asset-management-masters/categories': {
    title: 'Asset Categories',
    subtitle: 'Tenant-scoped classification records for Assets.',
  },
  '/asset-management-masters/statuses': {
    title: 'Asset Statuses',
    subtitle: 'Tenant-scoped operational lifecycle state records for Assets.',
  },
  '/global-references': {
    title: 'Global References',
    subtitle: 'Shared reference data used across Tenants.',
  },
};

export const appShellStats = [
  { label: 'Active Facility', value: 'Northgate General', icon: Hospital },
  { label: 'Open Appointments', value: '42', icon: CalendarClock },
  { label: 'Users Online', value: '18', icon: UserRoundCog },
  { label: 'Open Work Orders', value: '12', icon: Wrench },
];

export const appShellShortcuts = [
  {
    title: 'Appointment Masters',
    href: '/appointment-masters',
    description: 'Modes, types, statuses, reasons, and cancellation reasons.',
    icon: CalendarClock,
  },
  {
    title: 'Global References',
    href: '/global-references',
    description: 'Languages, Nationalities, Religions, Countries, and States.',
    icon: Languages,
  },
  {
    title: 'Identity & Access',
    href: '/identity-access/users',
    description: 'Users, Roles, Permission Assignments, and Sessions.',
    icon: ShieldCheck,
  },
  {
    title: 'Facility Context',
    href: '/settings',
    description: 'Active Tenant and Facility are always visible in the shell.',
    icon: MapPinned,
  },
];

function trimTrailingSlash(pathname: string) {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}

export function isNavItemActive(
  pathname: string,
  item: Pick<AppNavItem, 'href' | 'items' | 'exact'>
): boolean {
  const currentPath = trimTrailingSlash(pathname);
  const itemPath = trimTrailingSlash(item.href);

  if (currentPath === itemPath) {
    return true;
  }

  if (item.exact) {
    return false;
  }

  if (itemPath !== '/' && currentPath.startsWith(`${itemPath}/`)) {
    return true;
  }

  return item.items?.some((subItem) => isNavItemActive(currentPath, subItem)) ?? false;
}

export function getAppPageMeta(pathname: string): AppPageMeta {
  const currentPath = trimTrailingSlash(pathname);
  const exactMeta = pageMetaByHref[currentPath];

  if (exactMeta) {
    return exactMeta;
  }

  const parentMatch = Object.entries(pageMetaByHref)
    .filter(([href]) => href !== '/' && currentPath.startsWith(`${href}/`))
    .sort(([a], [b]) => b.length - a.length)[0];

  if (parentMatch) {
    return parentMatch[1];
  }

  const navItem = appNavGroups
    .flatMap((group) => group.items)
    .find((item) => isNavItemActive(currentPath, item));

  return {
    title: navItem?.title ?? 'Medical EMR',
    subtitle: 'Navigation shell for Tenant-scoped clinical and operational modules.',
  };
}
