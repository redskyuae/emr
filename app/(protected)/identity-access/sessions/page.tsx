import { SessionsPageClient } from '@/app/(protected)/identity-access/sessions/_components/sessions-page-client';
import { iamActiveSessions } from '@/app/(protected)/identity-access/dashboard/mock-data';

export default function SessionsPage() {
  return <SessionsPageClient sessions={iamActiveSessions} />;
}
