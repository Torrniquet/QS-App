import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TickerDetail } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { NUMBER_SCALES, NUMBER_SUFFIXES } from '@/lib/constants'

function formatMarketCap(value: number) {
  const { TRILLION, BILLION, MILLION } = NUMBER_SCALES
  const { TRILLION: T, BILLION: B, MILLION: M } = NUMBER_SUFFIXES

  if (value >= TRILLION) {
    return `$${(value / TRILLION).toFixed(2)}${T}`
  }
  if (value >= BILLION) {
    return `$${(value / BILLION).toFixed(2)}${B}`
  }
  if (value >= MILLION) {
    return `$${(value / MILLION).toFixed(2)}${M}`
  }
  return `$${value.toFixed(2)}`
}

export function CompanyInfo({
  tickerDetail,
  isLoading,
  isError,
}: {
  tickerDetail: TickerDetail | null
  isLoading: boolean
  isError: boolean
}) {
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load company information
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !tickerDetail) {
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
                <Skeleton className="mb-2 h-4 w-20" />{' '}
                {/* "Market Cap" label */}
                <Skeleton className="h-8 w-24" /> {/* Value */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
