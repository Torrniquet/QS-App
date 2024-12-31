import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TickerDetail } from '../hooks/useTickerDetail'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function formatMarketCap(marketCap: number): string {
  const trillion = 1e12
  const billion = 1e9
  const million = 1e6

  if (marketCap >= trillion) {
    return `$${(marketCap / trillion).toFixed(2)}T`
  }
  if (marketCap >= billion) {
    return `$${(marketCap / billion).toFixed(2)}B`
  }
  if (marketCap >= million) {
    return `$${(marketCap / million).toFixed(2)}M`
  }

  return `$${marketCap.toFixed(2)}`
}

export function CompanyInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Description lines */}
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  'h-4',
                  // Make last line shorter for natural look
                  i === 3 ? 'w-2/3' : 'w-full'
                )}
              />
            ))}
          </div>

          {/* Market Cap section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="mb-2 h-4 w-20" /> {/* "Market Cap" label */}
              <Skeleton className="h-8 w-24" /> {/* Value */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CompanyInfo({ tickerDetail }: { tickerDetail: TickerDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* TODO: Allow show more (maybe) */}
          <p className="line-clamp-6 text-sm text-muted-foreground">
            {tickerDetail.description}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Market Cap
              </p>
              <p className="text-2xl">
                {formatMarketCap(tickerDetail.market_cap)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
