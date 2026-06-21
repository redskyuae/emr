import { AuditLogPageClient } from '@/app/(protected)/audit-log/audit-log-page-client';
import { iamAuditEvents } from '@/app/(protected)/identity-access/dashboard/mock-data';

export default function AuditLogPage() {
  return <AuditLogPageClient events={iamAuditEvents} />;
}
