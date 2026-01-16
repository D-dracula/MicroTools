import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ArticleCardSkeleton() {
  return (
    <Card className="h-full bg-white dark:bg-card border-2 overflow-hidden">
      {/* Thumbnail skeleton with 16:9 aspect ratio */}
      <div className="relative w-full aspect-video bg-muted animate-pulse" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Category badge skeleton */}
          <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
          
          {/* Reading time skeleton */}
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>

        {/* Title skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary skeleton - 3 lines */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        </div>

        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-6 w-16 bg-muted rounded-md animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded-md animate-pulse" />
          <div className="h-6 w-14 bg-muted rounded-md animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
