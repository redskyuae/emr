import { Skeleton } from '@/components/ui/skeleton';

export default function MarketingLoader() {
  return (
    <main className="space-y-20 px-6 py-10 lg:px-10" aria-label="Loading marketing page">
      <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <Skeleton className="h-20 w-full max-w-2xl" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-32" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-20 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="min-h-[28rem] w-full rounded-2xl" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-44 w-full" />
        ))}
      </section>
    </main>
  );
}
