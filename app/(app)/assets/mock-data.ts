import {
  Activity,
  Bed,
  FlaskConical,
  HeartPulse,
  Scan,
  Scissors,
  Server,
  type LucideIcon,
} from 'lucide-react';

export type AssetStatus = 'in-use' | 'available' | 'maintenance' | 'repair' | 'retired';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export type AssetCategory = {
  id: 'imaging' | 'monitoring' | 'life' | 'surgical' | 'lab' | 'mobility' | 'it';
  name: string;
  icon: LucideIcon;
  color: string;
};

export type Asset = {
  id: string;
  name: string;
  categoryId: AssetCategory['id'];
  manufacturer: string;
  model: string;
  serial: string;
  status: AssetStatus;
  facility: string;
  department: string;
  location: string;
  custodian: string | null;
  purchaseDate: string;
  warranty: string;
  cost: number;
  value: number;
  lastService: string;
  nextService: string;
  calibration: string;
  condition: AssetCondition;
};

export type WorkOrderType = 'Preventive' | 'Corrective' | 'Calibration' | 'Inspection';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type WorkOrderStatus = 'open' | 'in-progress' | 'scheduled' | 'completed' | 'overdue';

export type WorkOrder = {
  id: string;
  assetId: string;
  assetLabel: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  technician: string;
  status: WorkOrderStatus;
  created: string;
  due: string;
  note: string;
};

export type BadgeTone = 'success' | 'info' | 'warning' | 'destructive' | 'neutral' | 'muted';

export type BadgeToneConfig = {
  label: string;
  tone: BadgeTone;
  className: string;
  dotClassName: string;
};

export const badgeToneClassByTone: Record<BadgeTone, Omit<BadgeToneConfig, 'label' | 'tone'>> = {
  success: {
    className: 'border-chart-4/20 bg-chart-4/10 text-chart-4',
    dotClassName: 'bg-chart-4',
  },
  info: {
    className: 'border-chart-2/20 bg-chart-2/10 text-chart-2',
    dotClassName: 'bg-chart-2',
  },
  warning: {
    className: 'border-chart-5/20 bg-chart-5/10 text-chart-5',
    dotClassName: 'bg-chart-5',
  },
  destructive: {
    className: 'border-destructive/20 bg-destructive/10 text-destructive',
    dotClassName: 'bg-destructive',
  },
  neutral: {
    className: 'border-border bg-muted text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
  },
  muted: {
    className: 'border-border bg-muted/60 text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
  },
};

function badgeConfig(label: string, tone: BadgeTone): BadgeToneConfig {
  return {
    label,
    tone,
    ...badgeToneClassByTone[tone],
  };
}

export const assetCategories: AssetCategory[] = [
  {
    id: 'imaging',
    name: 'Diagnostic Imaging',
    icon: Scan,
    color: 'bg-chart-1',
  },
  {
    id: 'monitoring',
    name: 'Patient Monitoring',
    icon: Activity,
    color: 'bg-chart-2',
  },
  {
    id: 'life',
    name: 'Life Support',
    icon: HeartPulse,
    color: 'bg-destructive',
  },
  {
    id: 'surgical',
    name: 'Surgical',
    icon: Scissors,
    color: 'bg-chart-3',
  },
  {
    id: 'lab',
    name: 'Laboratory',
    icon: FlaskConical,
    color: 'bg-chart-5',
  },
  {
    id: 'mobility',
    name: 'Mobility & Furniture',
    icon: Bed,
    color: 'bg-chart-4',
  },
  {
    id: 'it',
    name: 'IT & Network',
    icon: Server,
    color: 'bg-primary',
  },
];

export const assets: Asset[] = [
  {
    id: 'IMG-RAD-01',
    name: 'MRI Scanner 1.5T',
    categoryId: 'imaging',
    manufacturer: 'Siemens Healthineers',
    model: 'Magnetom Sola',
    serial: 'SN-MG-88421',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'Radiology',
    location: 'Block A · Radiology R-12',
    custodian: 'Dr. Omar Yusuf',
    purchaseDate: '15 Mar 2021',
    warranty: '15 Mar 2027',
    cost: 7200000,
    value: 5740000,
    lastService: '02 Apr 2026',
    nextService: '02 Jul 2026',
    calibration: '02 Jul 2026',
    condition: 'Excellent',
  },
  {
    id: 'IMG-RAD-02',
    name: 'CT Scanner 128-Slice',
    categoryId: 'imaging',
    manufacturer: 'GE Healthcare',
    model: 'Revolution Apex',
    serial: 'SN-CT-77820',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'Radiology',
    location: 'Block A · Radiology R-08',
    custodian: 'Dr. Omar Yusuf',
    purchaseDate: '22 Jun 2022',
    warranty: '22 Jun 2028',
    cost: 6100000,
    value: 4880000,
    lastService: '11 May 2026',
    nextService: '11 Aug 2026',
    calibration: '11 Aug 2026',
    condition: 'Excellent',
  },
  {
    id: 'IMG-ER-05',
    name: 'Portable X-Ray Unit',
    categoryId: 'imaging',
    manufacturer: 'Carestream',
    model: 'DRX-Revolution',
    serial: 'SN-XR-41190',
    status: 'maintenance',
    facility: 'Al Noor Hospital',
    department: 'Emergency',
    location: 'Block B · Emergency Bay 3',
    custodian: 'Khalid Nour',
    purchaseDate: '09 Sep 2020',
    warranty: 'Expired',
    cost: 320000,
    value: 210000,
    lastService: '09 Jun 2026',
    nextService: '05 Sep 2026',
    calibration: '18 Jun 2026',
    condition: 'Fair',
  },
  {
    id: 'MON-ICU-11',
    name: 'Patient Monitor',
    categoryId: 'monitoring',
    manufacturer: 'Philips',
    model: 'IntelliVue MX850',
    serial: 'SN-PM-63011',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'ICU',
    location: 'Block C · ICU Bed 4',
    custodian: 'Fatima Khalid',
    purchaseDate: '14 Oct 2022',
    warranty: '14 Oct 2027',
    cost: 118000,
    value: 82000,
    lastService: '10 Apr 2026',
    nextService: '20 Oct 2026',
    calibration: '10 Jul 2026',
    condition: 'Good',
  },
  {
    id: 'MON-W3-22',
    name: 'Patient Monitor',
    categoryId: 'monitoring',
    manufacturer: 'Mindray',
    model: 'BeneVision N17',
    serial: 'SN-PM-24931',
    status: 'available',
    facility: 'Al Noor Hospital',
    department: 'ICU',
    location: 'Block C · Ward 3B Store',
    custodian: null,
    purchaseDate: '04 Feb 2023',
    warranty: '04 Feb 2028',
    cost: 92000,
    value: 65000,
    lastService: '15 Jun 2026',
    nextService: '15 Sep 2026',
    calibration: '15 Sep 2026',
    condition: 'Good',
  },
  {
    id: 'MON-ONC-07',
    name: 'Infusion Pump',
    categoryId: 'monitoring',
    manufacturer: 'B. Braun',
    model: 'Infusomat Space',
    serial: 'SN-IP-17440',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'Oncology',
    location: 'Block D · Oncology Bay 2',
    custodian: 'Priya Menon',
    purchaseDate: '28 Aug 2021',
    warranty: 'Expired',
    cost: 26000,
    value: 14000,
    lastService: '28 May 2026',
    nextService: '28 Aug 2026',
    calibration: '28 Aug 2026',
    condition: 'Good',
  },
  {
    id: 'LIF-ICU-03',
    name: 'Ventilator',
    categoryId: 'life',
    manufacturer: 'Dräger',
    model: 'Evita V800',
    serial: 'SN-VT-88003',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'ICU',
    location: 'Block C · ICU Bed 1',
    custodian: 'Dr. Imran Khan',
    purchaseDate: '01 Sep 2021',
    warranty: '01 Sep 2027',
    cost: 210000,
    value: 144000,
    lastService: '01 Jun 2026',
    nextService: '01 Sep 2026',
    calibration: 'Overdue',
    condition: 'Good',
  },
  {
    id: 'LIF-ICU-04',
    name: 'Ventilator',
    categoryId: 'life',
    manufacturer: 'Hamilton Medical',
    model: 'Hamilton-C6',
    serial: 'SN-VT-44018',
    status: 'maintenance',
    facility: 'Al Noor Hospital',
    department: 'ICU',
    location: 'Block C · Biomed Workshop',
    custodian: 'Bilal Ahmed',
    purchaseDate: '18 Dec 2020',
    warranty: 'Expired',
    cost: 230000,
    value: 153000,
    lastService: '12 Jun 2026',
    nextService: '18 Jun 2026',
    calibration: '18 Jun 2026',
    condition: 'Fair',
  },
  {
    id: 'LIF-ER-09',
    name: 'Defibrillator',
    categoryId: 'life',
    manufacturer: 'Zoll',
    model: 'R Series',
    serial: 'SN-DF-10039',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'Emergency',
    location: 'Block B · Emergency Crash Cart',
    custodian: 'Khalid Nour',
    purchaseDate: '30 Jul 2022',
    warranty: '30 Jul 2027',
    cost: 84000,
    value: 58000,
    lastService: '25 Apr 2026',
    nextService: '30 Jul 2026',
    calibration: '30 Jul 2026',
    condition: 'Good',
  },
  {
    id: 'SUR-OR2-01',
    name: 'Anesthesia Workstation',
    categoryId: 'surgical',
    manufacturer: 'GE Healthcare',
    model: 'Aisys CS2',
    serial: 'SN-AW-22051',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'Surgery',
    location: 'Block E · OR 2',
    custodian: 'Dr. Layla Saeed',
    purchaseDate: '08 Aug 2022',
    warranty: '08 Aug 2028',
    cost: 340000,
    value: 233000,
    lastService: '08 May 2026',
    nextService: '08 Aug 2026',
    calibration: '08 Aug 2026',
    condition: 'Good',
  },
  {
    id: 'SUR-OR1-04',
    name: 'Surgical Laser System',
    categoryId: 'surgical',
    manufacturer: 'Lumenis',
    model: 'AcuPulse',
    serial: 'SN-LS-90014',
    status: 'repair',
    facility: 'Al Noor Hospital',
    department: 'Surgery',
    location: 'Block E · OR 1',
    custodian: 'Dr. Layla Saeed',
    purchaseDate: '14 Jan 2021',
    warranty: 'Expired',
    cost: 410000,
    value: 264000,
    lastService: '10 Jun 2026',
    nextService: 'On hold',
    calibration: 'N/A',
    condition: 'Poor',
  },
  {
    id: 'LAB-CL-12',
    name: 'Hematology Analyzer',
    categoryId: 'lab',
    manufacturer: 'Sysmex',
    model: 'XN-1000',
    serial: 'SN-HA-52190',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'Laboratory',
    location: 'Block F · Central Lab',
    custodian: 'Wei Chen',
    purchaseDate: '18 Jul 2022',
    warranty: '18 Jul 2027',
    cost: 230000,
    value: 161000,
    lastService: '14 Apr 2026',
    nextService: '18 Jul 2026',
    calibration: '18 Jul 2026',
    condition: 'Good',
  },
  {
    id: 'LAB-CL-15',
    name: 'Refrigerated Centrifuge',
    categoryId: 'lab',
    manufacturer: 'Eppendorf',
    model: '5810 R',
    serial: 'SN-RC-81035',
    status: 'available',
    facility: 'Al Noor Hospital',
    department: 'Laboratory',
    location: 'Block F · Central Lab',
    custodian: null,
    purchaseDate: '10 Oct 2023',
    warranty: '10 Oct 2028',
    cost: 46000,
    value: 30000,
    lastService: '10 Apr 2026',
    nextService: '10 Oct 2026',
    calibration: '10 Oct 2026',
    condition: 'Excellent',
  },
  {
    id: 'MOB-ICU-31',
    name: 'ICU Hospital Bed',
    categoryId: 'mobility',
    manufacturer: 'Hill-Rom',
    model: 'Progressa',
    serial: 'SN-BD-31031',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'ICU',
    location: 'Block C · ICU Bed 6',
    custodian: 'Fatima Khalid',
    purchaseDate: '22 Sep 2023',
    warranty: '22 Sep 2028',
    cost: 52000,
    value: 36000,
    lastService: '22 Mar 2026',
    nextService: '22 Sep 2026',
    calibration: 'N/A',
    condition: 'Excellent',
  },
  {
    id: 'MOB-ER-18',
    name: 'Transport Wheelchair',
    categoryId: 'mobility',
    manufacturer: 'Invacare',
    model: 'Tracer SX5',
    serial: 'SN-WC-18064',
    status: 'retired',
    facility: 'Al Noor Hospital',
    department: 'Emergency',
    location: 'Block B · Emergency Store',
    custodian: null,
    purchaseDate: '12 Feb 2018',
    warranty: 'Expired',
    cost: 12000,
    value: 9000,
    lastService: '12 Feb 2025',
    nextService: 'Retired',
    calibration: 'N/A',
    condition: 'Poor',
  },
  {
    id: 'IT-NET-02',
    name: 'Core Network Switch',
    categoryId: 'it',
    manufacturer: 'Cisco',
    model: 'Catalyst 9300',
    serial: 'SN-CS-93002',
    status: 'in-use',
    facility: 'Al Noor Hospital',
    department: 'IT',
    location: 'Block A · Network Rack 2',
    custodian: 'Rana Adnan',
    purchaseDate: '04 May 2022',
    warranty: '04 May 2027',
    cost: 28000,
    value: 16000,
    lastService: '04 May 2026',
    nextService: '04 Nov 2026',
    calibration: 'N/A',
    condition: 'Good',
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: 'WO-1042',
    assetId: 'LIF-ICU-04',
    assetLabel: 'Ventilator · Hamilton-C6',
    type: 'Preventive',
    priority: 'Medium',
    technician: 'Bilal Ahmed',
    status: 'in-progress',
    created: '12 Jun 2026',
    due: '18 Jun 2026',
    note: 'Scheduled 6-month PM — flow sensor + filter replacement.',
  },
  {
    id: 'WO-1041',
    assetId: 'SUR-OR1-04',
    assetLabel: 'Surgical Laser · AcuPulse',
    type: 'Corrective',
    priority: 'Critical',
    technician: 'Vendor (Lumenis)',
    status: 'open',
    created: '10 Jun 2026',
    due: '14 Jun 2026',
    note: 'Beam alignment fault — unit down, awaiting OEM engineer.',
  },
  {
    id: 'WO-1040',
    assetId: 'IMG-ER-05',
    assetLabel: 'Portable X-Ray · DRX',
    type: 'Calibration',
    priority: 'High',
    technician: 'Bilal Ahmed',
    status: 'scheduled',
    created: '09 Jun 2026',
    due: '18 Jun 2026',
    note: 'Annual radiation output calibration — compliance.',
  },
  {
    id: 'WO-1039',
    assetId: 'LIF-ICU-03',
    assetLabel: 'Ventilator · Evita V800',
    type: 'Calibration',
    priority: 'High',
    technician: 'Saad Iqbal',
    status: 'overdue',
    created: '01 Jun 2026',
    due: '12 Jun 2026',
    note: 'O2 sensor calibration overdue by 4 days.',
  },
  {
    id: 'WO-1038',
    assetId: 'MON-ICU-11',
    assetLabel: 'Patient Monitor · IntelliVue',
    type: 'Inspection',
    priority: 'Low',
    technician: 'Saad Iqbal',
    status: 'scheduled',
    created: '08 Jun 2026',
    due: '10 Jul 2026',
    note: 'Routine safety inspection + battery health check.',
  },
  {
    id: 'WO-1037',
    assetId: 'IMG-RAD-01',
    assetLabel: 'MRI Scanner · Magnetom Sola',
    type: 'Preventive',
    priority: 'Medium',
    technician: 'Vendor (Siemens)',
    status: 'completed',
    created: '28 Mar 2026',
    due: '02 Apr 2026',
    note: 'Quarterly PM completed — cryogen level topped up.',
  },
  {
    id: 'WO-1036',
    assetId: 'LIF-ER-09',
    assetLabel: 'Defibrillator · R Series',
    type: 'Inspection',
    priority: 'Medium',
    technician: 'Bilal Ahmed',
    status: 'completed',
    created: '25 Apr 2026',
    due: '30 Apr 2026',
    note: 'Energy discharge test passed; pads in date.',
  },
  {
    id: 'WO-1035',
    assetId: 'LAB-CL-12',
    assetLabel: 'Hematology Analyzer · XN-1000',
    type: 'Preventive',
    priority: 'Low',
    technician: 'Wei Chen',
    status: 'completed',
    created: '14 Apr 2026',
    due: '18 Apr 2026',
    note: 'Reagent lines flushed; QC samples within range.',
  },
];

export const assetStatusBadgeMap: Record<AssetStatus, BadgeToneConfig> = {
  'in-use': badgeConfig('In Use', 'success'),
  available: badgeConfig('Available', 'info'),
  maintenance: badgeConfig('Maintenance', 'warning'),
  repair: badgeConfig('Repair', 'destructive'),
  retired: badgeConfig('Retired', 'neutral'),
};

export const workOrderStatusBadgeMap: Record<WorkOrderStatus, BadgeToneConfig> = {
  open: badgeConfig('Open', 'neutral'),
  'in-progress': badgeConfig('In Progress', 'info'),
  scheduled: badgeConfig('Scheduled', 'warning'),
  completed: badgeConfig('Completed', 'success'),
  overdue: badgeConfig('Overdue', 'destructive'),
};

export const workOrderPriorityBadgeMap: Record<WorkOrderPriority, BadgeToneConfig> = {
  Low: badgeConfig('Low', 'muted'),
  Medium: badgeConfig('Medium', 'info'),
  High: badgeConfig('High', 'warning'),
  Critical: badgeConfig('Critical', 'destructive'),
};

export function formatAedCompact(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    const maximumFractionDigits = absoluteValue >= 10_000_000 ? 1 : 2;
    const formatted = (value / 1_000_000).toLocaleString('en-US', {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    });

    return `AED ${formatted}M`;
  }

  if (absoluteValue >= 1_000) {
    const formatted = Math.round(value / 1_000).toLocaleString('en-US');

    return `AED ${formatted}K`;
  }

  return `AED ${value.toLocaleString('en-US')}`;
}
