import { cn } from '@/lib/utils'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  BookmarkCheckIcon,
  BookmarkIcon,
} from 'lucide-react'
import { PriceData, TickerDetail } from '@/lib/schemas'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { getBookmarks, toggleBookmark } from '@/lib/bookmarks'

export function StockHeader({
  priceData,
  tickerDetail,
  isLoading,
  isError,
}: {
  priceData: PriceData | null
  tickerDetail: TickerDetail | null
  isLoading: boolean
  isError: boolean
}) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    void getBookmarks().then((bookmarks) =>
      setIsBookmarked(bookmarks.includes(tickerDetail?.ticker || ''))
    )
  }, [tickerDetail?.ticker])

  if (isError) {
    return (
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-destructive">Failed to load stock data</p>
        </div>
      </div>
    )
  }

  if (isLoading || !priceData || !tickerDetail) {
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

  const handleBookmarkToggle = () => {
    void toggleBookmark(tickerDetail.ticker).then((updatedBookmarks) => {
      setIsBookmarked(updatedBookmarks.includes(tickerDetail.ticker))
    })
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-bold">{tickerDetail.ticker}</h1>
        <p className="text-xl text-muted-foreground">{tickerDetail.name}</p>
      </div>
      <div className="flex gap-2 text-right">
        <Button
          variant="outline"
          onClick={handleBookmarkToggle}
          className="px-3"
        >
          {isBookmarked ? <BookmarkCheckIcon /> : <BookmarkIcon />}
        </Button>
        <div className="flex flex-col">
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
    </div>
  )
}
