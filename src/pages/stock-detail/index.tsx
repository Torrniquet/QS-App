import { useParams } from 'react-router'
import { useTickerDetail } from './hooks/useTickerDetail'
import { useStockPrice } from './hooks/useStockPrice'
import { useTimeframe } from '@/hooks/use-timeframe'
import { RSI } from './components/rsi'
import { MACD } from './components/macd'
import { StockHeader, StockHeaderSkeleton } from './components/stock-header'
import { RecentTrades, RecentTradesSkeleton } from './components/recent-trades'
import { CompanyInfo, CompanyInfoSkeleton } from './components/company-info'
import { PriceChart } from './components/price-chart'
import { SMA } from './components/sma'

export function StockDetailPage() {
  const { symbol } = useParams()

  const timeframe = useTimeframe()

  const { data: tickerDetail, isLoading: isTickerDetailLoading } =
    useTickerDetail(symbol)

  // TODO: use the disconnected state and the other connection states to show to the user
  const { priceData, isPriceDataLoading } = useStockPrice({
    symbol,
    timeframe,
  })

  const isStockDataLoading = isTickerDetailLoading || isPriceDataLoading

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      {/* Header */}
      {isStockDataLoading || !priceData || !tickerDetail ? (
        <StockHeaderSkeleton />
      ) : (
        <StockHeader priceData={priceData} tickerDetail={tickerDetail} />
      )}

      <PriceChart symbol={symbol} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {isPriceDataLoading || !priceData ? (
          <RecentTradesSkeleton />
        ) : (
          <RecentTrades trades={priceData.trades} />
        )}

        {/* Company Info */}
        {isTickerDetailLoading || !tickerDetail ? (
          <CompanyInfoSkeleton />
        ) : (
          <CompanyInfo tickerDetail={tickerDetail} />
        )}

        <RSI symbol={symbol} />
        <MACD symbol={symbol} />
        <SMA symbol={symbol} />
      </div>
    </div>
  )
}
