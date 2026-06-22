import { SessionsPageImpl } from '@/app/(protected)/identity-access/sessions/_components/sessions-page-impl';
import { iamActiveSessions } from '@/app/(protected)/identity-access/dashboard/mock-data';

export default function SessionsPage() {
  return <SessionsPageImpl sessions={iamActiveSessions} />;
}
