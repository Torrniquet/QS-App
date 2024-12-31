import { cn } from '@/lib/utils'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { PriceData } from '../hooks/useStockPrice'
import { TickerDetail } from '../hooks/useTickerDetail'
import { Skeleton } from '@/components/ui/skeleton'

export function StockHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <Skeleton className="mb-2 h-10 w-32" /> {/* Ticker */}
        <Skeleton className="h-7 w-48" /> {/* Company name */}
      </div>
      <div className="text-right">
        <Skeleton className="mb-2 ml-auto h-9 w-32" /> {/* Price */}
        <Skeleton className="ml-auto h-7 w-24" /> {/* Change */}
      </div>
    </div>
  )
}

export function StockHeader({
  priceData,
  tickerDetail,
}: {
  priceData: PriceData
  tickerDetail: TickerDetail
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-bold">{tickerDetail.ticker}</h1>
        <p className="text-xl text-muted-foreground">{tickerDetail.name}</p>
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold">${priceData.price.toFixed(2)}</p>
        <div
          className={cn('flex items-center justify-end text-lg', {
            'text-green-600': priceData.change >= 0,
            'text-red-600': priceData.change < 0,
          })}
        >
          {priceData.change >= 0 ? (
            <ArrowUpIcon className="h-5 w-5" />
          ) : (
            <ArrowDownIcon className="h-5 w-5" />
          )}
          <span>
            {Math.abs(priceData.change).toFixed(2)} (
            {Math.abs(priceData.changePercent).toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
