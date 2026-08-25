import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BedDouble,
  Boxes,
  Building2,
  CalendarClock,
  CalendarPlus,
  Clock3,
  ClipboardList,
  FileClock,
  Gauge,
  Globe2,
  Hospital,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  MapPinned,
  ReceiptText,
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
  permission?: string;
  items?: {
    title: string;
    href: string;
    badge?: string;
    permission?: string;
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
        permission: 'patient',
      },
      {
        title: 'Appointments',
        href: '/appointments',
        icon: CalendarClock,
        exact: true,
      },
      {
        title: 'Book Appointment',
        href: '/appointments/new',
        icon: CalendarPlus,
      },
    ],
  },
  {
    title: 'Outpatient',
    items: [
      {
        title: 'Visits',
        href: '/visits',
        icon: ClipboardList,
        permission: 'visit',
      },
    ],
  },
  {
    title: 'Inpatient',
    items: [
      {
        title: 'Admissions',
        href: '/admissions',
        icon: BedDouble,
        permission: 'admission',
      },
      {
        title: 'Bed Board',
        href: '/bed-board',
        icon: LayoutGrid,
        permission: 'bed',
      },
    ],
  },
  {
    title: 'Billing',
    items: [
      {
        title: 'Invoices',
        href: '/billing',
        icon: ReceiptText,
        exact: true,
        permission: 'invoice',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Rooms',
        href: '/rooms',
        icon: BedDouble,
      },
      {
        title: 'Doctors',
        href: '/doctors',
        icon: Stethoscope,
        permission: 'doctor',
      },
      {
        title: 'Doctor Schedules',
        href: '/doctor-schedules',
        icon: CalendarClock,
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
        permission: 'staff',
      },
      {
        title: 'Roles & Permissions',
        href: '/identity-access/roles',
        icon: ShieldCheck,
        permission: 'role',
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
        permission: 'tenant',
      },
      {
        title: 'Rota Management',
        href: '/rota-management',
        icon: Clock3,
      },
      {
        title: 'Appointment Masters',
        href: '/appointment-masters',
        icon: CalendarClock,
        items: [
          {
            title: 'Mode',
            href: '/appointment-masters/modes',
            permission: 'appointment-mode',
          },
          {
            title: 'Type',
            href: '/appointment-masters/types',
            permission: 'appointment-type',
          },
          {
            title: 'Status',
            href: '/appointment-masters/statuses',
            permission: 'appointment-status',
          },
          {
            title: 'Reason',
            href: '/appointment-masters/reasons',
            permission: 'appointment-reason',
          },
          {
            title: 'Cancelled Reason',
            href: '/appointment-masters/cancelled-reasons',
            permission: 'appointment-cancelled-reason',
          },
        ],
      },
      {
        title: 'Visit Masters',
        href: '/visit-masters',
        icon: ClipboardList,
        items: [
          {
            title: 'Visit Type',
            href: '/visit-masters/visit-types',
            permission: 'visit-type',
          },
        ],
      },
      {
        title: 'Inpatient Masters',
        href: '/inpatient-masters',
        icon: Hospital,
        items: [
          { title: 'Wards', href: '/inpatient-masters/wards', permission: 'ward' },
          { title: 'Beds', href: '/inpatient-masters/beds', permission: 'bed' },
          {
            title: 'Admission Types',
            href: '/inpatient-masters/admission-types',
            permission: 'admission-type',
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
          { title: 'Work Order Type', href: '/asset-management-masters/work-order-types' },
          { title: 'Work Order Priority', href: '/asset-management-masters/work-order-priorities' },
          { title: 'Work Order Status', href: '/asset-management-masters/work-order-statuses' },
        ],
      },
      {
        title: 'Room Masters',
        href: '/room-masters',
        icon: BedDouble,
        items: [{ title: 'Room Type', href: '/room-masters/types' }],
      },
      {
        title: 'Billing Masters',
        href: '/billing-masters',
        icon: ReceiptText,
        items: [
          {
            title: 'Charge Items',
            href: '/billing-masters/charge-items',
            permission: 'charge-item',
          },
        ],
      },
      {
        title: 'Clinical Masters',
        href: '/clinical-masters',
        icon: ClipboardList,
        items: [
          {
            title: 'Diagnosis Codes',
            href: '/clinical-masters/diagnosis-codes',
            permission: 'diagnosis-code',
          },
          { title: 'Allergens', href: '/clinical-masters/allergens', permission: 'allergen' },
          {
            title: 'Note Types',
            href: '/clinical-masters/note-types',
            permission: 'clinical-note-type',
          },
        ],
      },
      {
        title: 'Global References',
        href: '/global-references',
        icon: Globe2,
        items: [
          { title: 'Languages', href: '/global-references/languages', permission: 'language' },
          {
            title: 'Nationalities',
            href: '/global-references/nationalities',
            permission: 'nationality',
          },
          { title: 'Religions', href: '/global-references/religions', permission: 'religion' },
          { title: 'Countries', href: '/global-references/countries', permission: 'country' },
          { title: 'States', href: '/global-references/states', permission: 'state' },
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
      label: 'Book Appointment',
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
    subtitle: 'Schedule and track outpatient appointments for this Tenant.',
    primaryAction: {
      label: 'Book Appointment',
      href: '/appointments/new',
    },
  },
  '/appointments/new': {
    title: 'Book Appointment',
    subtitle: 'Reserve DoctorSlots and create an Appointment for this Tenant.',
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
  '/doctor-schedules': {
    title: 'Doctor Schedules',
    subtitle: 'Doctor availability assignments built from Doctor Rotas.',
    primaryAction: {
      label: 'New schedule',
      href: '/doctor-schedules?schedule=new',
    },
  },
  '/doctors': {
    title: 'Doctors',
    subtitle: 'Staff-backed Doctors, Specialties, and clinical profile details.',
    primaryAction: {
      label: 'Add Doctor',
      href: '/doctors?doctor=new',
    },
  },
  '/audit-log': {
    title: 'Audit Log',
    subtitle: 'Identity and access audit activity for this Tenant.',
  },
  '/tenant-profile': {
    title: 'Tenant Profile',
    subtitle: 'Tenant display details and operating status.',
  },
  '/rota-management': {
    title: 'Rota Management',
    subtitle: 'Reusable Doctor Rota templates for scheduling Doctors.',
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
  '/visits': {
    title: 'Visits',
    subtitle: "Today's outpatient queue. Check Patients in from an Appointment or as a Walk-in.",
  },
  '/admissions': {
    title: 'Admissions',
    subtitle: 'The inpatient census. Admit Patients to Beds, transfer, and discharge.',
    primaryAction: {
      label: 'Admit patient',
      href: '/admissions?admit=new',
    },
  },
  '/bed-board': {
    title: 'Bed Board',
    subtitle: 'Ward-wise Bed occupancy with the Patient in every Occupied Bed.',
  },
  '/billing': {
    title: 'Invoices',
    subtitle: 'Raise, finalize, and collect payment on patient Invoices.',
    primaryAction: {
      label: 'New Invoice',
      href: '/billing?invoice=new',
    },
  },
  '/inpatient-masters': {
    title: 'Inpatient Masters',
    subtitle: 'Tenant-scoped inpatient configuration.',
  },
  '/inpatient-masters/wards': {
    title: 'Wards',
    subtitle: 'Tenant-scoped named sections of the Facility that contain Beds.',
  },
  '/inpatient-masters/beds': {
    title: 'Beds',
    subtitle: 'Physical Beds within Wards, with system-managed occupancy.',
  },
  '/inpatient-masters/admission-types': {
    title: 'Admission Types',
    subtitle: 'Tenant-scoped records classifying how a Patient came to be admitted.',
  },
  '/visit-masters/visit-types': {
    title: 'Visit Types',
    subtitle: 'Tenant-scoped records classifying the clinical nature of a Visit.',
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
  '/asset-management-masters/work-order-types': {
    title: 'Work Order Types',
    subtitle: 'Tenant-scoped maintenance work classification records for Work Orders.',
  },
  '/asset-management-masters/work-order-priorities': {
    title: 'Work Order Priorities',
    subtitle: 'Tenant-scoped urgency ranking records for Work Orders.',
  },
  '/asset-management-masters/work-order-statuses': {
    title: 'Work Order Statuses',
    subtitle: 'Tenant-scoped lifecycle state records for Work Orders.',
  },
  '/rooms': {
    title: 'Rooms',
    subtitle: 'Room registry, Bed capacity, and availability across this Tenant.',
    primaryAction: {
      label: 'Add room',
      href: '/rooms?room=new',
    },
  },
  '/room-masters/types': {
    title: 'Room Types',
    subtitle: 'Tenant-scoped classification and daily rate records for Rooms.',
  },
  '/global-references': {
    title: 'Global References',
    subtitle: 'Shared reference data used across Tenants.',
  },
  '/global-references/languages': {
    title: 'Languages',
    subtitle: 'Shared Language Global References used in Patient demographics.',
    primaryAction: {
      label: 'Add Language',
      href: '/global-references/languages?language=new',
    },
  },
  '/global-references/nationalities': {
    title: 'Nationalities',
    subtitle: 'Shared Nationality Global References used during Patient Registration.',
    primaryAction: {
      label: 'Add Nationality',
      href: '/global-references/nationalities?nationality=new',
    },
  },
  '/global-references/religions': {
    title: 'Religions',
    subtitle: 'Shared Religion Global References used in Patient demographics.',
    primaryAction: {
      label: 'Add Religion',
      href: '/global-references/religions?religion=new',
    },
  },
  '/global-references/countries': {
    title: 'Countries',
    subtitle: 'Shared Country Global References used for addresses and identity context.',
    primaryAction: {
      label: 'Add Country',
      href: '/global-references/countries?country=new',
    },
  },
  '/global-references/states': {
    title: 'States',
    subtitle: 'Shared State Global References grouped under Countries.',
    primaryAction: {
      label: 'Add State',
      href: '/global-references/states?state=new',
    },
  },
  '/clinical-masters/diagnosis-codes': {
    title: 'Diagnosis Codes',
    subtitle: 'Tenant-scoped ICD-10 diagnosis catalogue used across clinical records.',
    primaryAction: {
      label: 'Add Diagnosis Code',
      href: '/clinical-masters/diagnosis-codes?create=1',
    },
  },
  '/clinical-masters/allergens': {
    title: 'Allergens',
    subtitle: 'Tenant-scoped Allergen catalogue used when recording Patient allergies.',
    primaryAction: {
      label: 'Add Allergen',
      href: '/clinical-masters/allergens?create=1',
    },
  },
  '/clinical-masters/note-types': {
    title: 'Clinical Note Types',
    subtitle: 'Tenant-scoped classification records for Clinical Notes.',
    primaryAction: {
      label: 'Add Note Type',
      href: '/clinical-masters/note-types?create=1',
    },
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

function hasNavPermission(resource: string | undefined, grantedResources: Set<string>): boolean {
  return !resource || grantedResources.has(resource);
}

function filterNavItem(item: AppNavItem, grantedResources: Set<string>): AppNavItem | null {
  if (!hasNavPermission(item.permission, grantedResources)) {
    return null;
  }

  if (!item.items?.length) {
    return item;
  }

  const items = item.items.filter((subItem) => hasNavPermission(subItem.permission, grantedResources));

  return items.length > 0 ? { ...item, items } : null;
}

export function getVisibleNavGroups(groups: AppNavGroup[], permissions: string[]): AppNavGroup[] {
  const grantedResources = new Set(permissions.map((permission) => permission.split(':')[0]));

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterNavItem(item, grantedResources))
        .filter((item): item is AppNavItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
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
