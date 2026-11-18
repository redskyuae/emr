import { ViewSkeleton } from '@/app/(protected)/global-references/languages/_components/language-skeletons';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// The index redirects to Languages, so its loader is shaped like the Languages page.
export default function GlobalReferencesPageLoader() {
  return (
    <div className="space-y-4" aria-label="Loading Global References">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-full lg:max-w-sm" />
          <Skeleton className="h-10 w-full sm:ml-auto sm:w-36" />
        </CardContent>
      </Card>

      <ViewSkeleton layout="table" canEdit canDelete />
    </div>
  );
}
