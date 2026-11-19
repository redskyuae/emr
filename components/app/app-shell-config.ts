import type { IconType } from 'react-icons';
import {
  CiBoxes,
  CiCalendarDate,
  CiClock1,
  CiCreditCard1,
  CiFileOn,
  CiGlobe,
  CiGrid41,
  CiGrid42,
  CiHospital1,
  CiReceipt,
  CiSettings,
  CiShoppingTag,
  CiStethoscope,
  CiWavePulse1,
} from 'react-icons/ci';
import {
  PiBedLight,
  PiBuildingsLight,
  PiCalendarPlusLight,
  PiClipboardTextLight,
  PiClockCounterClockwiseLight,
  PiFileLight,
  PiGaugeLight,
  PiListChecksLight,
  PiShieldCheckLight,
  PiUserGearLight,
  PiUsersLight,
  PiWrenchLight,
} from 'react-icons/pi';

export type AppNavItem = {
  title: string;
  href: string;
  icon: IconType;
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
  /**
   * Shown at the end of the page header. Only for pages whose own content has no always-visible
   * button for the same action; a list page with a create button in its toolbar leaves this out.
   */
  primaryAction?: {
    label: string;
    href: string;
    permission?: string;
  };
};

export const appNavGroups: AppNavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: PiGaugeLight,
      },
    ],
  },
  {
    title: 'Clinical',
    items: [
      {
        title: 'Patients',
        href: '/patients',
        icon: PiUsersLight,
        permission: 'patient',
      },
      {
        title: 'Appointments',
        href: '/appointments',
        icon: CiCalendarDate,
        exact: true,
        permission: 'appointment',
      },
      {
        title: 'Book Appointment',
        href: '/appointments/new',
        icon: PiCalendarPlusLight,
        permission: 'appointment',
      },
    ],
  },
  {
    title: 'Outpatient',
    items: [
      {
        title: 'Visits',
        href: '/visits',
        icon: PiClipboardTextLight,
        permission: 'visit',
      },
      {
        title: 'Previous Visits',
        href: '/previous-visits',
        icon: PiClockCounterClockwiseLight,
        permission: 'visit',
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: CiFileOn,
        permission: 'visit',
      },
      {
        title: 'Visit List',
        href: '/visit-list',
        icon: PiListChecksLight,
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
        icon: PiBedLight,
        permission: 'admission',
      },
      {
        title: 'Bed Board',
        href: '/bed-board',
        icon: CiGrid41,
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
        icon: CiReceipt,
        exact: true,
        permission: 'invoice',
      },
      {
        title: 'Billing Counter',
        href: '/billing-counter',
        icon: CiCreditCard1,
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
        icon: PiBedLight,
        permission: 'room',
      },
      {
        title: 'Doctors',
        href: '/doctors',
        icon: CiStethoscope,
        permission: 'doctor',
      },
      {
        title: 'Therapists',
        href: '/therapists',
        icon: PiUserGearLight,
        permission: 'therapist',
      },
      {
        title: 'Doctor Schedules',
        href: '/doctor-schedules',
        icon: CiCalendarDate,
        permission: 'doctor-schedule',
      },
      {
        title: 'Therapist Schedules',
        href: '/therapist-schedules',
        icon: CiCalendarDate,
        permission: 'therapist-schedule',
      },
    ],
  },
  {
    title: 'Identity & Access',
    items: [
      {
        title: 'Users',
        href: '/identity-access/users',
        icon: PiUsersLight,
        permission: 'staff',
      },
      {
        title: 'Roles & Permissions',
        href: '/identity-access/roles',
        icon: PiShieldCheckLight,
        permission: 'role',
      },
      {
        title: 'Sessions',
        href: '/identity-access/sessions',
        icon: PiFileLight,
        permission: 'session',
      },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      {
        title: 'Overview',
        href: '/assets-management',
        icon: CiGrid42,
        exact: true,
        permission: 'asset',
      },
      {
        title: 'Inventory',
        href: '/assets-management/inventory',
        icon: CiBoxes,
        permission: 'asset',
      },
      {
        title: 'Maintenance',
        href: '/assets-management/maintenance',
        icon: PiWrenchLight,
        permission: 'work-order',
      },
    ],
  },
  {
    title: 'Activity',
    items: [
      {
        title: 'Audit Log',
        href: '/audit-log',
        icon: CiWavePulse1,
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        title: 'Tenant Profile',
        href: '/tenant-profile',
        icon: PiBuildingsLight,
        permission: 'tenant',
      },
      {
        title: 'Rota Management',
        href: '/rota-management',
        icon: CiClock1,
        permission: 'doctor-rota',
      },
      {
        title: 'Appointment Masters',
        href: '/appointment-masters',
        icon: CiCalendarDate,
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
        icon: PiClipboardTextLight,
        items: [
          {
            title: 'Visit Type',
            href: '/visit-masters/visit-types',
            permission: 'visit-type',
          },
          {
            title: 'Admit Source',
            href: '/visit-masters/admit-sources',
            permission: 'admit-source',
          },
        ],
      },
      {
        title: 'Inpatient Masters',
        href: '/inpatient-masters',
        icon: CiHospital1,
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
        icon: CiShoppingTag,
        items: [
          {
            title: 'Categories',
            href: '/asset-management-masters/categories',
            permission: 'asset-category',
          },
          {
            title: 'Conditions',
            href: '/asset-management-masters/conditions',
            permission: 'asset-condition',
          },
          {
            title: 'Status',
            href: '/asset-management-masters/statuses',
            permission: 'asset-status',
          },
          {
            title: 'Work Order Type',
            href: '/asset-management-masters/work-order-types',
            permission: 'work-order-type',
          },
          {
            title: 'Work Order Priority',
            href: '/asset-management-masters/work-order-priorities',
            permission: 'work-order-priority',
          },
          {
            title: 'Work Order Status',
            href: '/asset-management-masters/work-order-statuses',
            permission: 'work-order-status',
          },
        ],
      },
      {
        title: 'Room Masters',
        href: '/room-masters',
        icon: PiBedLight,
        items: [{ title: 'Room Type', href: '/room-masters/types', permission: 'room-type' }],
      },
      {
        title: 'Billing Masters',
        href: '/billing-masters',
        icon: CiReceipt,
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
        icon: PiClipboardTextLight,
        items: [
          {
            title: 'ICD-10-CM Diagnosis Codes',
            href: '/clinical-masters/diagnosis-codes',
            permission: 'diagnosis-code',
          },
          {
            title: 'Ayurveda Diagnosis Codes',
            href: '/clinical-masters/ayurveda-diagnosis-codes',
            permission: 'ayurveda-diagnosis-code',
          },
          { title: 'Allergens', href: '/clinical-masters/allergens', permission: 'allergen' },
          {
            title: 'Note Types',
            href: '/clinical-masters/note-types',
            permission: 'clinical-note-type',
          },
          {
            title: 'Therapist Skills',
            href: '/clinical-masters/therapist-skills',
            permission: 'therapist-skill',
          },
        ],
      },
      {
        title: 'Global References',
        href: '/global-references',
        icon: CiGlobe,
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
        icon: CiSettings,
        badge: '404',
      },
    ],
  },
];

const appointmentNavHrefs = new Set([
  '/dashboard',
  '/patients',
  '/appointments',
  '/appointments/new',
  '/rooms',
  '/doctors',
  '/therapists',
  '/doctor-schedules',
  '/therapist-schedules',
  '/rota-management',
  '/appointment-masters',
  '/appointment-masters/modes',
  '/appointment-masters/types',
  '/appointment-masters/statuses',
  '/appointment-masters/reasons',
  '/appointment-masters/cancelled-reasons',
  '/room-masters',
  '/room-masters/types',
  '/clinical-masters',
  '/clinical-masters/therapist-skills',
  '/billing-masters',
  '/billing-masters/charge-items',
]);

const visitNavHrefs = new Set(['/visits', '/previous-visits', '/reports', '/visit-list']);

const demoNavHrefs = new Set(['/reports', '/visit-list', '/billing-counter']);

const pageMetaByHref: Record<string, AppPageMeta> = {
  '/dashboard': {
    title: 'Appointment Dashboard',
    subtitle: "Today's bookings, arrivals, and schedule for this Tenant.",
    primaryAction: {
      label: 'Book Appointment',
      href: '/appointments/new',
      permission: 'appointment:create',
    },
  },
  '/patients': {
    title: 'Patients',
    subtitle: 'Patient registry and demographics for this Tenant.',
  },
  '/patients/new': {
    title: 'Register patient',
    subtitle: 'Capture demographics, contact details, and identifiers for this Tenant.',
  },
  '/appointments': {
    title: 'Appointments',
    subtitle: 'Schedule and track outpatient appointments for this Tenant.',
  },
  '/appointments/new': {
    title: 'Book Appointment',
    subtitle: 'Schedule a Patient Visit with the right clinician, time, and resources.',
  },
  '/identity-access/users': {
    title: 'Users',
    subtitle: 'Staff user access within this Tenant.',
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
  },
  '/therapist-schedules': {
    title: 'Therapist Schedules',
    subtitle: 'Therapist availability assignments built from reusable Rota templates.',
  },
  '/doctors': {
    title: 'Doctors',
    subtitle: 'Staff-backed Doctors, Specialties, and clinical profile details.',
  },
  '/therapists': {
    title: 'Therapists',
    subtitle: 'Staff-backed Therapists and their treatment skills.',
  },
  '/clinical-masters/therapist-skills': {
    title: 'Therapist Skills',
    subtitle: 'Tenant-scoped skills used to qualify Therapists for Treatment Sessions.',
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
    primaryAction: {
      label: 'Create Visit',
      href: '/visits/new',
      permission: 'visit:create',
    },
  },
  '/previous-visits': {
    title: 'Previous Visits',
    subtitle: 'Search past outpatient Visits by date range, Doctor, status, and Visit Type.',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Generate Outpatient reports for a date range or a month.',
  },
  '/visit-list': {
    title: 'Visit List',
    subtitle: 'Search every outpatient Visit by date, Doctor, status, type, source, and billing.',
    // The page's only other Create Visit link is in its empty state.
    primaryAction: {
      label: 'Create Visit',
      href: '/visits/new',
      permission: 'visit:create',
    },
  },
  '/billing-counter': {
    title: 'Billing Counter',
    subtitle: 'Invoice, collect advances, refund, and close the shift for this Counter.',
  },
  '/visits/new': {
    title: 'Check in Patient',
    subtitle: 'Review Patient, Appointment, card, and Visit details in one workspace.',
  },
  '/admissions': {
    title: 'Admissions',
    subtitle: 'The inpatient census. Admit Patients to Beds, transfer, and discharge.',
  },
  '/bed-board': {
    title: 'Bed Board',
    subtitle: 'Ward-wise Bed occupancy with the Patient in every Occupied Bed.',
  },
  '/billing': {
    title: 'Invoices',
    subtitle: 'Raise, finalize, and collect payment on patient Invoices.',
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
  '/visit-masters/admit-sources': {
    title: 'Admit Sources',
    subtitle: 'Tenant-scoped records of how a Patient came to a Visit.',
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
  '/asset-management-masters/conditions': {
    title: 'Asset Conditions',
    subtitle: 'Tenant-scoped physical condition records for Assets.',
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
  },
  '/global-references/nationalities': {
    title: 'Nationalities',
    subtitle: 'Shared Nationality Global References used during Patient Registration.',
  },
  '/global-references/religions': {
    title: 'Religions',
    subtitle: 'Shared Religion Global References used in Patient demographics.',
  },
  '/global-references/countries': {
    title: 'Countries',
    subtitle: 'Shared Country Global References used for addresses and identity context.',
  },
  '/global-references/states': {
    title: 'States',
    subtitle: 'Shared State Global References grouped under Countries.',
  },
  '/clinical-masters/diagnosis-codes': {
    title: 'ICD-10-CM Diagnosis Codes',
    subtitle:
      'Tenant-scoped ICD-10-CM diagnosis catalogue used across clinical records and claims.',
  },
  '/clinical-masters/ayurveda-diagnosis-codes': {
    title: 'Ayurveda Diagnosis Codes',
    subtitle: 'Tenant-scoped Ayurveda diagnosis catalogue, mapped to ICD-10-CM for claims.',
    primaryAction: {
      label: 'Add Ayurveda Diagnosis Code',
      href: '/clinical-masters/ayurveda-diagnosis-codes?ayurvedaCode=new',
      permission: 'ayurveda-diagnosis-code:create',
    },
  },
  '/clinical-masters/allergens': {
    title: 'Allergens',
    subtitle: 'Tenant-scoped Allergen catalogue used when recording Patient allergies.',
  },
  '/clinical-masters/note-types': {
    title: 'Clinical Note Types',
    subtitle: 'Tenant-scoped classification records for Clinical Notes.',
  },
};

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

function filterNavItem(
  item: AppNavItem,
  grantedResources: Set<string>,
  appointmentsOnly: boolean,
  showVisits: boolean,
  showDemoPages: boolean
): AppNavItem | null {
  if (
    !hasNavPermission(item.permission, grantedResources) ||
    (!showDemoPages && demoNavHrefs.has(item.href)) ||
    (appointmentsOnly &&
      !appointmentNavHrefs.has(item.href) &&
      !(showVisits && visitNavHrefs.has(item.href)))
  ) {
    return null;
  }

  if (!item.items?.length) {
    return item;
  }

  const items = item.items.filter(
    (subItem) =>
      hasNavPermission(subItem.permission, grantedResources) &&
      (!appointmentsOnly || appointmentNavHrefs.has(subItem.href))
  );

  return items.length > 0 ? { ...item, items } : null;
}

export function getVisibleNavGroups(
  groups: AppNavGroup[],
  permissions: string[],
  appointmentsOnly = false,
  showVisits = false,
  showDemoPages = false
): AppNavGroup[] {
  const grantedResources = new Set(permissions.map((permission) => permission.split(':')[0]));

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) =>
          filterNavItem(item, grantedResources, appointmentsOnly, showVisits, showDemoPages)
        )
        .filter((item): item is AppNavItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}

export function getAppPageMeta(pathname: string): AppPageMeta {
  const currentPath = trimTrailingSlash(pathname);

  if (/^\/visits\/\d+\/assessment$/.test(currentPath)) {
    return {
      title: 'Clinician assessment',
      subtitle: 'Complete this Visit in the active Facility context.',
    };
  }

  if (/^\/visits\/\d+\/summary$/.test(currentPath)) {
    return {
      title: 'Visit Summary',
      subtitle: 'Print the Patient copy of this Visit.',
    };
  }

  if (/^\/appointments\/\d+\/reschedule$/.test(currentPath)) {
    return {
      title: 'Reschedule Appointment',
      subtitle: 'Move a booked Appointment to another date, time, or resource.',
    };
  }

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

/**
 * The title of the navigation group a page belongs to, shown above the page title. The most
 * specific item wins, and `exact` is ignored so a detail page still takes its section's group.
 */
export function getAppPageGroup(pathname: string): string | undefined {
  const currentPath = trimTrailingSlash(pathname);
  const owns = (href: string) => {
    const itemPath = trimTrailingSlash(href);
    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
  };

  const match = appNavGroups
    .flatMap((group) =>
      group.items.flatMap((item) =>
        [item.href, ...(item.items?.map((subItem) => subItem.href) ?? [])]
          .filter(owns)
          .map((href) => ({ group: group.title, depth: trimTrailingSlash(href).length }))
      )
    )
    .sort((a, b) => b.depth - a.depth)[0];

  return match?.group;
}
