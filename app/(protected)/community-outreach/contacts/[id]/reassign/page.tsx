import { ReassignPageImpl } from './_components/reassign-page-impl';

export default async function ReassignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ReassignPageImpl contactId={id} />;
}
