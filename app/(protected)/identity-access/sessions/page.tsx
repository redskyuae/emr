import { SessionsPageImpl } from '@/app/(protected)/identity-access/sessions/_components/sessions-page-impl';
import { iamActiveSessions } from '@/app/(protected)/identity-access/sessions/_utils/sessions-mock';

export default function SessionsPage() {
  return <SessionsPageImpl sessions={iamActiveSessions} />;
}
