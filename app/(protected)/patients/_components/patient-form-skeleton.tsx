import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function FieldsSkeleton({ count }: { count: number }) {
  return Array.from({ length: count }, (_, field) => <FieldSkeleton key={field} />);
}

function CheckboxFieldSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <Skeleton className="size-4 rounded-sm" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

// Mirrors PatientForm's cards one by one: the same titles, grids and field counts, the
// Emirates ID row with its Read button and the Identity documents block. It lives beside
// PatientForm because Patient registration and Patient edit both render that form; each
// page adds its own actions row below.
export function PatientFormSkeleton() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Identifiers</CardTitle>
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxFieldSkeleton />
            <CheckboxFieldSkeleton />
          </div>
          <div className="grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
            <FieldSkeleton />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxFieldSkeleton />
            <CheckboxFieldSkeleton />
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full max-w-lg" />
            </div>
            <Skeleton className="h-9 w-48" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldsSkeleton count={4} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldsSkeleton count={4} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <FieldsSkeleton count={5} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <Skeleton className="h-4 w-52 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FieldsSkeleton count={3} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldsSkeleton count={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FieldsSkeleton count={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next of Kin</CardTitle>
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FieldsSkeleton count={4} />
        </CardContent>
      </Card>
    </>
  );
}
