import { AuditLogPageImpl } from '@/app/(protected)/audit-log/_components/audit-log-page-impl';
import { iamAuditEvents } from '@/app/(protected)/identity-access/dashboard/mock-data';

export default function AuditLogPage() {
  return <AuditLogPageImpl events={iamAuditEvents} />;
}
