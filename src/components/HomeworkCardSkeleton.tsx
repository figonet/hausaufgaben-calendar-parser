import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeworkCardSkeleton() {
  return (
    <Card className="relative overflow-hidden backdrop-blur-sm bg-card/50 border border-border/50 min-h-[180px]">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted" />
      
      <div className="relative p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-5 flex-1" />
        </div>
        
        <Skeleton className="h-3 w-32 ml-10" />
        <div className="space-y-2 ml-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </Card>
  );
}
