import { UserAuditDetailImpl } from './_components/user-audit-detail-impl';

type UserAuditDetailPageProps = {
  params: Promise<{ userId: string }>;
};

// A segment that is still percent-encoded is decoded once; a malformed one is passed
// through, and the API answers 404 for an id that is not a member of the Tenant.
function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function UserAuditDetailPage({ params }: UserAuditDetailPageProps) {
  const { userId } = await params;

  return <UserAuditDetailImpl userId={decodeSegment(userId)} />;
}
