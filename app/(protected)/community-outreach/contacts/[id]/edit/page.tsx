import { EditContactPageImpl } from './_components/edit-contact-page-impl';

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EditContactPageImpl contactId={id} />;
}
