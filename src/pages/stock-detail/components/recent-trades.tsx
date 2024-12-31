import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PriceData } from '@/lib/schemas'

// Mapping for trade conditions
// More actually exist
// But this is fine for a side project
const CONDITIONS_MAP = {
  0: { label: 'Regular', class: 'bg-blue-500' },
  2: { label: 'Dark Pool', class: 'bg-purple-500' },
  37: { label: 'Odd Lot', class: 'bg-orange-500' },
} as const

export function RecentTrades({
  trades,
  isLoading,
  isError,
}: {
  trades: PriceData['trades'] | null
  isLoading: boolean
  isError: boolean
}) {
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load trade data</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !trades) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="flex flex-col gap-2">
              {/* Render 8 skeleton trades */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded p-2"
                >
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" /> {/* Price */}
                    <Skeleton className="h-5 w-12" /> {/* Size */}
                  </div>
                  <Skeleton className="h-5 w-16" /> {/* Condition badge */}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col gap-2">
            {trades.map((trade, index) => (
              <div
                key={`${trade.timestamp}-${index}`}
                className="flex items-center justify-between gap-3 rounded p-2 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono">${trade.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">({trade.size})</span>
                </div>
                <div className="flex items-center gap-2">
                  {trade.conditions.map((conditionCode, index) => {
                    const condition =
                      CONDITIONS_MAP[
                        conditionCode as keyof typeof CONDITIONS_MAP
                      ]

                    return (
                      <Badge
                        key={`${conditionCode}-${index}`}
                        variant="secondary"
                      >
                        {condition?.label || 'Other'}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
