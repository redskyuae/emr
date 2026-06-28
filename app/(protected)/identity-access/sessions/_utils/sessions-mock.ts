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
