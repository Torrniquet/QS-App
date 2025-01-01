import { StockCardSkeletonList } from '@/components/StockCardSkeletonList'
import { StockCard } from '@/components/StockCard'
import { useGetStocksBySymbols } from '@/hooks/use-get-stocks-by-symbols'
import { tickerKeys } from '@/lib/queryKeys'
import { snapshotKeys } from '@/lib/queryKeys'

const POPULAR_TICKERS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'NVDA',
  'TSLA',
  'BRK.A',
]

const POPULAR_STOCKS_COUNT = POPULAR_TICKERS.length

export function PopularStocks() {
  const { stocks, isStocksError, stocksError, isStocksLoading } =
    useGetStocksBySymbols({
      tickers: POPULAR_TICKERS,
      tickerQueryKey: tickerKeys.popular(),
      snapshotQueryKey: snapshotKeys.popular(),
      limit: POPULAR_STOCKS_COUNT,
    })

  if (isStocksLoading) {
    return <StockCardSkeletonList count={POPULAR_STOCKS_COUNT} />
  }

  if (isStocksError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-2xl font-bold">Error loading popular stocks</p>
        <p className="text-lg text-gray-600">{stocksError?.message}</p>
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
