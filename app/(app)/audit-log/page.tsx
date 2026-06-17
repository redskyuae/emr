import { AuditLogPageClient } from '@/app/(app)/audit-log/audit-log-page-client';
import { iamAuditEvents } from '@/app/(app)/identity-access/dashboard/mock-data';

export default function AuditLogPage() {
  return <AuditLogPageClient events={iamAuditEvents} />;
}
