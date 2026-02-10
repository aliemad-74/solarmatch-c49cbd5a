import { Skeleton } from "@/components/ui/skeleton";

const ResultsSkeleton = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="text-center mb-10">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-5">
              <Skeleton className="w-10 h-10 rounded-xl mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-6">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-32 mb-6" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSkeleton;
