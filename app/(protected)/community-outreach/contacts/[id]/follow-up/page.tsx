import { FollowUpPageImpl } from './_components/follow-up-page-impl';

export default async function FollowUpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <FollowUpPageImpl contactId={id} />;
}
