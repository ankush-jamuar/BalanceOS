import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for active group grid cards on the Dashboard.
 */
export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-32 rounded-md bg-muted/50" />
        <Skeleton className="h-5 w-16 rounded-full bg-muted/50" />
      </div>
      <Skeleton className="h-4 w-48 rounded-md bg-muted/50" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-24 rounded-md bg-muted/50" />
        <div className="flex -space-x-2">
          <Skeleton className="h-7 w-7 rounded-full bg-muted/50 border-2 border-card" />
          <Skeleton className="h-7 w-7 rounded-full bg-muted/50 border-2 border-card" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for transaction/expense lists on the Group Workspace.
 */
export function ExpenseRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border/50 animate-pulse">
      <div className="flex items-center space-x-4">
        {/* Date block visual */}
        <Skeleton className="h-10 w-10 rounded-xl bg-muted/50" />
        <div className="space-y-2">
          {/* Title */}
          <Skeleton className="h-4 w-32 rounded-md bg-muted/50" />
          {/* Metadata */}
          <Skeleton className="h-3 w-48 rounded-md bg-muted/50" />
        </div>
      </div>
      <div className="text-right space-y-2">
        {/* Amount */}
        <Skeleton className="h-4 w-16 rounded-md bg-muted/50 ml-auto" />
        {/* Payer name */}
        <Skeleton className="h-3 w-12 rounded-md bg-muted/50 ml-auto" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for top summary cards (Total Owed, Total Receivable, Net status).
 */
export function BalanceSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 h-32 flex flex-col justify-between animate-pulse">
          <Skeleton className="h-4 w-24 rounded-md bg-muted/50" />
          <Skeleton className="h-8 w-28 rounded-md bg-muted/50" />
        </div>
      ))}
    </div>
  );
}
