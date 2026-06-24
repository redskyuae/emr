import {Skeleton} from "@/components/ui/skeleton";

export function PermissionMatrixSkeleton() {
    return (
        <div className="space-y-7">
            {[0, 1, 2].map((section) => (
                <section key={section} className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b pb-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="divide-y rounded-md border">
                        {[0, 1, 2].map((resource) => (
                            <div key={resource} className="grid gap-3 p-3 md:grid-cols-3 md:items-start">
                                <Skeleton className="h-5 w-32" />
                                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:col-span-2 xl:grid-cols-3">
                                    {[0, 1, 2, 3].map((action) => (
                                        <Skeleton key={action} className="h-7 w-full" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}