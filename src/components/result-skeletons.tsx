import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted/70",
        className,
      )}
    />
  );
}

export function IntentBadgeSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-7 w-32 rounded-full" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

export function MostNaturalSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function StyleCardSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <p className="sr-only">Memuat {label}</p>
    </div>
  );
}
