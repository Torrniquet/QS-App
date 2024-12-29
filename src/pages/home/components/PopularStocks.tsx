import { POPULAR_STOCKS_COUNT } from '../hooks/usePopularStocks'
import { usePopularStocks } from '../hooks/usePopularStocks'
import { StockCardSkeletonList } from './StockCardSkeletonList'
import { StockCard } from './StockCard'
export function PopularStocks() {
  const {
    isPopularStocksError,
    isPopularStocksLoading,
    popularStocks,
    popularStocksError,
  } = usePopularStocks()

  if (isPopularStocksLoading) {
    return <StockCardSkeletonList count={POPULAR_STOCKS_COUNT} />
  }

  if (isPopularStocksError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className="text-2xl font-bold">Error loading popular stocks</p>
        <p className="text-lg text-gray-600">{popularStocksError?.message}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {popularStocks.map((stock) => (
        <StockCard key={stock.symbol} stock={stock} />
      ))}
    </div>
  )
}
