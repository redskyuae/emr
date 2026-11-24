import {
  PiDevicesLight,
  PiGlobeLight,
  PiListChecksLight,
  PiPulseLight,
  PiSignInLight,
  PiWarningCircleLight,
} from 'react-icons/pi';

import type { UserAuditDetail } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';
import { StatCard, StatCardSkeleton } from '@/components/app/stat-card';
import { formatAuditTime } from '../../../_utils/audit-log-filters';

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6';

export function UserAuditStats({
  summary,
  timeZone,
}: {
  summary: UserAuditDetail['summary'];
  timeZone: string | undefined;
}) {
  const lastSignIn = summary.lastSignInAt
    ? `Last ${formatAuditTime(summary.lastSignInAt, timeZone)}`
    : 'No sign-in recorded yet';
  const lastActivity = summary.lastActivityAt
    ? `Last ${formatAuditTime(summary.lastActivityAt, timeZone)}`
    : 'No activity recorded yet';

  return (
    <div className={GRID}>
      <StatCard
        label="Sign-ins"
        value={summary.signInCount}
        hint={lastSignIn}
        icon={PiSignInLight}
        tone="primary"
      />
      <StatCard
        label="Failed sign-ins"
        value={summary.failedSignInCount}
        hint="Wrong password or blocked account"
        icon={PiWarningCircleLight}
        tone={summary.failedSignInCount > 0 ? 'destructive' : 'neutral'}
      />
      <StatCard
        label="Active Sessions"
        value={summary.activeSessionCount}
        hint="Signed in right now"
        icon={PiPulseLight}
        tone={summary.activeSessionCount > 0 ? 'success' : 'neutral'}
      />
      <StatCard
        label="Actions"
        value={summary.actionCount}
        hint={lastActivity}
        icon={PiListChecksLight}
      />
      <StatCard
        label="IP addresses"
        value={summary.ipAddressCount}
        hint="Distinct, in this range"
        icon={PiGlobeLight}
      />
      <StatCard
        label="Devices"
        value={summary.deviceCount}
        hint="Distinct browsers and devices"
        icon={PiDevicesLight}
      />
    </div>
  );
}

export function UserAuditStatsSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }, (_, index) => (
        <StatCardSkeleton key={index} hint />
      ))}
    </div>
  );
}
