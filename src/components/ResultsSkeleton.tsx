import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Sun } from "lucide-react";

const ResultsSkeleton = () => {
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Loading message */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Sun className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            <div>
              <p className="text-lg font-semibold text-foreground">{t('loading.analyzing')}</p>
              <p className="text-sm text-muted-foreground">{t('loading.subtitle')}</p>
            </div>
          </div>
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