import type {
  ChargeItem,
  CounterPatient,
  CounterState,
  LedgerLine,
  LedgerTxn,
  ResolvedTender,
  TenderMethod,
} from '../_utils/counter-types';

export const COUNTER_ENTITY = {
  trn: '100234567800003',
  licence: 'DOH MF-4521',
  currency: 'AED',
  vatRate: 5,
  claimsVia: 'Shafafiya (Abu Dhabi DOH e-claims)',
  invoiceSeries: 'AUH-INV-2026-…',
  legalName: 'Al Ameen Ayurveda Clinic L.L.C.',
  legalNameArabic: 'عيادة الأمين للأيورفيدا ذ.م.م',
  facility: 'Abu Dhabi',
  address: 'Office 304, Al Bateen Tower, Abu Dhabi, UAE',
} as const;

export const COUNTER_CASHIER = 'Reem K. (Cashier)';

// Methods this Counter accepts. A Facility without UPI or Google Pay switches them off here.
export const COUNTER_ENABLED_METHODS: TenderMethod[] = [
  'CASH',
  'CARD',
  'UPI',
  'GOOGLE_PAY',
  'BANK_TRANSFER',
  'CHEQUE',
  'OTHER',
];

export const APPROVERS = [
  'Dr. Nisha Menon (Medical Director)',
  'Hassan Ali (Finance Manager)',
  'Reem Khalid (Branch Supervisor)',
] as const;

export const REFUND_REASONS = [
  'Session not delivered',
  'Treatment cancelled by clinic',
  'Patient request — unused advance',
  'Duplicate payment',
  'Overpayment',
  'Billing error',
] as const;

export const ADVANCE_PURPOSES = [
  'Treatment advance',
  'Package deposit',
  'Procedure deposit',
  'Consultation prepayment',
] as const;

export const CHARGE_ITEMS: ChargeItem[] = [
  {
    code: '99202',
    cpt: '99202',
    vatRate: 5,
    unitPrice: 250,
    coverable: true,
    category: 'Consultation',
    description: 'New patient consultation',
  },
  {
    code: '99213',
    cpt: '99213',
    vatRate: 5,
    unitPrice: 180,
    coverable: true,
    category: 'Consultation',
    description: 'Established patient consultation',
  },
  {
    cpt: null,
    code: 'ABH',
    vatRate: 5,
    unitPrice: 350,
    coverable: false,
    category: 'Therapy',
    description: 'Abhyanga, 60 min',
  },
  {
    cpt: null,
    code: 'KIZ',
    vatRate: 5,
    unitPrice: 380,
    coverable: false,
    category: 'Therapy',
    description: 'Elakizhi, 45 min',
  },
  {
    cpt: null,
    code: 'SHD',
    vatRate: 5,
    unitPrice: 420,
    coverable: false,
    category: 'Therapy',
    description: 'Shirodhara, 45 min',
  },
  {
    cpt: null,
    code: 'JNB',
    vatRate: 5,
    unitPrice: 300,
    coverable: true,
    category: 'Therapy',
    description: 'Janu Basti, 40 min',
  },
  {
    cpt: null,
    code: 'YOG',
    vatRate: 5,
    unitPrice: 150,
    coverable: false,
    category: 'Wellness',
    description: 'Yoga & Pranayama session',
  },
  {
    code: '83036',
    cpt: '83036',
    vatRate: 5,
    unitPrice: 120,
    coverable: true,
    category: 'Investigation',
    description: 'Lab — HbA1c',
  },
  {
    cpt: null,
    code: 'MED1',
    vatRate: 0,
    unitPrice: 85,
    coverable: true,
    category: 'Pharmacy',
    description: 'Ashwagandha capsules x60 (registered medicine)',
  },
  {
    cpt: null,
    code: 'MED2',
    vatRate: 0,
    unitPrice: 55,
    coverable: true,
    category: 'Pharmacy',
    description: 'Triphala tablets x60 (registered medicine)',
  },
];

export const COUNTER_PATIENTS: CounterPatient[] = [
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000110',
    advanceBalance: 3000,
    category: 'Resident',
    name: 'Mrs. Priya Nair',
    phone: '+971 52 441 7788',
    visits: [{ number: 'VST-1026', label: 'Panchakarma Session · today' }],
  },
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000131',
    advanceBalance: 4000,
    category: 'Resident',
    name: 'Mr. John Carter',
    phone: '+971 50 118 2204',
    visits: [{ number: 'VST-1025', label: 'OPD Consultation · today' }],
  },
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000129',
    advanceBalance: 26000,
    category: 'Tourist',
    name: 'Ms. Anna Petrova',
    phone: '+7 916 555 0199',
    visits: [{ number: 'VST-1024', label: 'Procedure · today (cancelled)' }],
  },
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000101',
    advanceBalance: 0,
    category: 'Resident',
    name: 'Mr. Rahul Sharma',
    phone: '+971 55 302 9911',
    visits: [{ number: 'VST-1019', label: 'OPD Consultation · today' }],
  },
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000104',
    advanceBalance: 0,
    category: 'Resident',
    name: 'Ms. Leena Joseph',
    phone: '+971 56 774 3120',
    visits: [{ number: 'VST-1020', label: 'OPD Consultation · today' }],
  },
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000107',
    advanceBalance: 2000,
    category: 'Resident',
    name: 'Ms. Deepa Menon',
    phone: '+971 54 220 6745',
    visits: [{ number: 'VST-1021', label: 'Follow-up · today' }],
  },
  {
    mrn: 'AYU000112',
    advanceBalance: 0,
    category: 'GCC National',
    name: 'Mr. Khalid Al Nuaimi',
    phone: '+971 50 667 4412',
    payer: 'Daman Enhanced',
    memberId: 'DAN-4471920',
    visits: [{ number: 'VST-1022', label: 'Follow-up · today' }],
  },
  {
    mrn: 'AYU000115',
    advanceBalance: 0,
    category: 'Resident',
    name: 'Ms. Maria Santos',
    phone: '+971 58 903 1175',
    payer: 'Thiqa',
    memberId: 'THQ-8820145',
    visits: [{ number: 'VST-1023', label: 'OPD Consultation · today' }],
  },
  {
    payer: null,
    memberId: null,
    mrn: 'AYU000121',
    advanceBalance: 0,
    category: 'Resident',
    name: 'Ms. Sneha Pillai',
    phone: '+971 55 481 2290',
    visits: [{ number: 'VST-1027', label: 'OPD Consultation · today (checked in)' }],
  },
  {
    visits: [],
    payer: null,
    memberId: null,
    mrn: 'AYU000118',
    advanceBalance: 500,
    category: 'GCC National',
    name: 'Mr. Mohammed Al Hashemi',
    phone: '+971 52 816 0053',
  },
];

function cash(amount: number, tendered = amount): ResolvedTender {
  return {
    amount,
    tendered,
    bank: '',
    details: {},
    method: 'CASH',
    reference: '',
    change: Math.round((tendered - amount) * 100) / 100,
  };
}

function other(
  method: TenderMethod,
  amount: number,
  reference: string,
  details: Record<string, string> = {}
): ResolvedTender {
  return { method, amount, reference, bank: '', details, tendered: null, change: 0 };
}

function line(
  code: string,
  description: string,
  quantity: number,
  unitPrice: number,
  vatRate: number
): LedgerLine {
  const taxable = Math.round(quantity * unitPrice * 100) / 100;
  const vat = Math.round(taxable * vatRate) / 100;

  return {
    vat,
    code,
    taxable,
    vatRate,
    quantity,
    unitPrice,
    description,
    discount: 0,
    discountPercent: 0,
    billTo: 'PATIENT',
    total: Math.round((taxable + vat) * 100) / 100,
  };
}

type SeedInput = Partial<LedgerTxn> &
  Pick<LedgerTxn, 'number' | 'time' | 'type' | 'patientMrn' | 'patientName' | 'tenders'>;

function txn(seed: SeedInput): LedgerTxn {
  const patientPaid = seed.tenders.reduce((sum, t) => sum + t.amount, 0);

  return {
    vat: 0,
    shiftNo: 1,
    total: 0,
    taxable: 0,
    lines: [],
    reason: null,
    against: null,
    payerShare: 0,
    outstanding: 0,
    description: '',
    approvedBy: null,
    discountReason: null,
    discountApprovedBy: null,
    payerAuthNumber: null,
    visitNumber: null,
    receiptNumber: null,
    refundOfInvoice: null,
    patientPaid: seed.type === 'CREDIT_NOTE' ? -patientPaid : patientPaid,
    id: seed.number,
    ...seed,
  };
}

// Mirrors the figures on the cashier's Day-close screen: cash 36,503.00, card
// 2,306.60, advances received 36,000.00, payers 1,079.40, refunds 4,000.00.
function seedLedger(): LedgerTxn[] {
  const priyaLines = [
    line('ABH', 'Abhyanga, 60 min', 1, 350, 5),
    line('KIZ', 'Elakizhi, 45 min', 1, 380, 5),
    line('MED2', 'Triphala tablets x60 (registered medicine)', 2, 55, 0),
  ];

  return [
    txn({
      time: '14:58',
      type: 'CREDIT_NOTE',
      number: 'AUH-CN-2026-000043',
      patientMrn: 'AYU000129',
      patientName: 'Ms. Anna Petrova',
      tenders: [cash(4000)],
      total: -4000,
      taxable: -3809.52,
      vat: -190.48,
      against: 'Advance balance',
      reason: 'Session not delivered',
      description: 'Session not delivered',
      approvedBy: 'Dr. Nisha Menon (Medical Director)',
    }),
    txn({
      time: '14:58',
      type: 'ADVANCE',
      number: 'AUH-ADV-2026-000313',
      patientMrn: 'AYU000129',
      patientName: 'Ms. Anna Petrova',
      tenders: [cash(30000)],
      total: 30000,
      taxable: 28571.43,
      vat: 1428.57,
      reason: 'Treatment advance',
      description: 'Treatment advance',
      receiptNumber: 'AUH-RCP-2026-005105',
    }),
    txn({
      time: '14:57',
      type: 'ADVANCE',
      number: 'AUH-ADV-2026-000312',
      patientMrn: 'AYU000131',
      patientName: 'Mr. John Carter',
      tenders: [cash(4000)],
      total: 4000,
      taxable: 3809.52,
      vat: 190.48,
      reason: 'Treatment advance',
      description: 'Treatment advance',
      receiptNumber: 'AUH-RCP-2026-005104',
    }),
    txn({
      time: '14:55',
      type: 'INVOICE',
      number: 'AUH-INV-2026-002420',
      patientMrn: 'AYU000110',
      patientName: 'Mrs. Priya Nair',
      visitNumber: 'VST-1026',
      tenders: [cash(1034, 1500)],
      total: 1034,
      taxable: 990,
      vat: 44,
      lines: [...priyaLines, line('YOG', 'Yoga & Pranayama session', 1, 150, 5)],
      description: 'Abhyanga, Elakizhi, Triphala tablets, Yoga & Pranayama session',
      receiptNumber: 'AUH-RCP-2026-005103',
    }),
    txn({
      time: '14:49',
      type: 'INVOICE',
      number: 'AUH-INV-2026-002419',
      patientMrn: 'AYU000110',
      patientName: 'Mrs. Priya Nair',
      visitNumber: 'VST-1026',
      tenders: [cash(876.5)],
      total: 876.5,
      taxable: 840,
      vat: 36.5,
      lines: priyaLines,
      description: 'Abhyanga, Elakizhi, Triphala tablets',
      receiptNumber: 'AUH-RCP-2026-005102',
    }),
    txn({
      time: '11:40',
      type: 'INVOICE',
      number: 'AUH-INV-2026-002417',
      patientMrn: 'AYU000115',
      patientName: 'Ms. Maria Santos',
      visitNumber: 'VST-1023',
      tenders: [
        other('CARD', 44.1, 'A-77120', { last4: '4242', network: 'Visa', cardType: 'Debit' }),
        cash(20),
      ],
      total: 461,
      taxable: 439.05,
      vat: 21.95,
      payerShare: 396.9,
      description: 'Consultation (Thiqa co-pay 14%)',
      payerAuthNumber: 'THQ-AUTH-55012',
      receiptNumber: 'AUH-RCP-2026-005101',
    }),
    txn({
      time: '11:05',
      type: 'INVOICE',
      number: 'AUH-INV-2026-002416',
      patientMrn: 'AYU000112',
      patientName: 'Mr. Khalid Al Nuaimi',
      visitNumber: 'VST-1022',
      tenders: [],
      total: 682.5,
      taxable: 650,
      vat: 32.5,
      payerShare: 682.5,
      description: 'Consultation and Janu Basti (Daman Enhanced, fully covered)',
      payerAuthNumber: 'DAN-AUTH-90871',
    }),
    txn({
      time: '10:30',
      type: 'ADVANCE',
      number: 'AUH-ADV-2026-000308',
      patientMrn: 'AYU000107',
      patientName: 'Ms. Deepa Menon',
      tenders: [
        other('CARD', 2000, 'A-76544', {
          last4: '1881',
          network: 'Mastercard',
          cardType: 'Credit',
        }),
      ],
      total: 2000,
      taxable: 1904.76,
      vat: 95.24,
      reason: 'Treatment advance',
      description: 'Treatment advance',
      receiptNumber: 'AUH-RCP-2026-005100',
    }),
    txn({
      time: '09:48',
      type: 'INVOICE',
      number: 'AUH-INV-2026-002414',
      patientMrn: 'AYU000104',
      patientName: 'Ms. Leena Joseph',
      visitNumber: 'VST-1020',
      tenders: [
        other('CARD', 262.5, 'A-76210', { last4: '0005', network: 'Visa', cardType: 'Debit' }),
        cash(100),
      ],
      total: 362.5,
      taxable: 345.24,
      vat: 17.26,
      description: 'New patient consultation (split tender)',
      receiptNumber: 'AUH-RCP-2026-005099',
    }),
    txn({
      time: '09:12',
      type: 'INVOICE',
      number: 'AUH-INV-2026-002413',
      patientMrn: 'AYU000101',
      patientName: 'Mr. Rahul Sharma',
      visitNumber: 'VST-1019',
      tenders: [cash(472.5)],
      total: 472.5,
      taxable: 450,
      vat: 22.5,
      description: 'Established consultation and medicines',
      receiptNumber: 'AUH-RCP-2026-005098',
    }),
  ];
}

export function createSeedState(): CounterState {
  return {
    ledger: seedLedger(),
    closedShifts: [],
    sequences: { inv: 2420, adv: 313, cn: 43, rcp: 5105 },
    advanceBalances: Object.fromEntries(
      COUNTER_PATIENTS.map((patient) => [patient.mrn, patient.advanceBalance])
    ),
    shift: {
      no: 1,
      closing: null,
      status: 'OPEN',
      openedAt: '08:30',
      authorizedBy: null,
      openingFloat: 1000,
      counter: 'Counter 1',
      cashier: COUNTER_CASHIER,
      openingBasis: 'DEFAULT',
    },
  };
}
