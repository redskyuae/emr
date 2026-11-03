import { ActivityDetailPageImpl } from './_components/activity-detail-page-impl';

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ActivityDetailPageImpl activityId={id} />;
}
