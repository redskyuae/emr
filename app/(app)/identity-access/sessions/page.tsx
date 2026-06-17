import { SessionsPageClient } from '@/app/(app)/identity-access/sessions/sessions-page-client';
import { iamActiveSessions } from '@/app/(app)/identity-access/dashboard/mock-data';

export default function SessionsPage() {
  return <SessionsPageClient sessions={iamActiveSessions} />;
}
