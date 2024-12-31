import { StockCardSkeletonList } from '@/components/StockCardSkeletonList'
import { StockCard } from '@/components/StockCard'
import { useGetStocksBySymbols } from '@/hooks/useGetStocksBySymbols'
import { snapshotKeys, tickerKeys } from '@/lib/queryKeys'
import { Stock } from '@/lib/schemas'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Link } from 'react-router'
import { getBookmarks, BookmarkedTickers } from '@/lib/bookmarks'
import { ROUTES } from '@/lib/constants'

export function BookmarksPage() {
  const [bookmarkedTickers, setBookmarkedTickers] =
    useState<BookmarkedTickers | null>(null)
  const [initialBookmarkStocksStatus, setInitialBookmarkStocksStatus] =
    useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function loadBookmarkedTickers() {
      try {
        const tickers = await getBookmarks()
        setBookmarkedTickers(tickers || [])
        setInitialBookmarkStocksStatus('success')
      } catch (error) {
        console.error('Failed to load bookmarked tickers:', error)
        setInitialBookmarkStocksStatus('error')
      }
    }

    void loadBookmarkedTickers()
  }, [])

  const { stocks, isStocksError, isStocksLoading } = useGetStocksBySymbols({
    snapshotQueryKey: snapshotKeys.bookmarked(),
    tickerQueryKey: tickerKeys.bookmarked(),
    tickers: bookmarkedTickers || [],
    enabled: Boolean(bookmarkedTickers?.length),
  })

  // Show loading while we're fetching the initial bookmarks
  if (initialBookmarkStocksStatus === 'loading') {
    return (
      <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <h1 className="text-4xl font-bold">Bookmarks</h1>
        <StockCardSkeletonList count={18} />
      </div>
    )
  }

  // Show empty state if no bookmarks
  if (!bookmarkedTickers?.length) {
    return (
      <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <h1 className="text-4xl font-bold">Bookmarks</h1>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg text-muted-foreground">
            You haven&apos;t bookmarked any stocks yet
          </p>
          <Button asChild>
            <Link to={ROUTES.SEARCH} prefetch="render">
              <Search className="h-4 w-4" />
              Start searching for stocks
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold">
        Bookmarks ({bookmarkedTickers?.length})
      </h1>
      <BookmarkedStocks
        stocks={stocks || []}
        isLoading={isStocksLoading}
        isError={isStocksError}
      />
    </div>
  )
}

function BookmarkedStocks({
  stocks,
  isLoading,
  isError,
}: {
  stocks: Array<Stock>
  isLoading: boolean
  isError: boolean
}) {
  if (isLoading) {
    return <StockCardSkeletonList count={30} />
  }

  if (isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-sm text-destructive">
          Failed to load bookmarked stocks
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  )
}
