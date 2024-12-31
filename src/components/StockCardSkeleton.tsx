import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function StockCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-4 w-40" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}
