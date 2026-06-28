import { AuditLogPageImpl } from '@/app/(protected)/audit-log/_components/audit-log-page-impl';
import { iamAuditEvents } from '@/app/(protected)/audit-log/_utils/audit-log-mock';

export default function AuditLogPage() {
  return <AuditLogPageImpl events={iamAuditEvents} />;
}
