import { useParams } from 'react-router'
import { useTickerDetail } from './hooks/use-ticker-detail'
import { useStockPrice } from './hooks/use-stock-price'
import { useTimeframe } from '@/hooks/use-timeframe'
import { RSI } from './components/rsi'
import { MACD } from './components/macd'
import { StockHeader } from './components/stock-header'
import { RecentTrades } from './components/recent-trades'
import { CompanyInfo } from './components/company-info'
import { PriceChart } from './components/price-chart'
import { SMA } from './components/sma'

export function StockDetailPage() {
  const { symbol } = useParams()

  const timeframe = useTimeframe()

  const {
    data: tickerDetail,
    isLoading: isTickerDetailLoading,
    isError: isTickerDetailError,
  } = useTickerDetail(symbol)

  // TODO: use the disconnected state and the other connection states to show to the user
  const { priceData, isPriceDataLoading, isPriceDataError } = useStockPrice({
    symbol,
    timeframe,
  })

  const isStockDataLoading = isTickerDetailLoading || isPriceDataLoading

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      <StockHeader
        priceData={priceData || null}
        tickerDetail={tickerDetail || null}
        isLoading={isStockDataLoading}
        isError={isTickerDetailError || isPriceDataError}
      />

      <PriceChart symbol={symbol} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        <RecentTrades
          trades={priceData?.trades || null}
          isLoading={isPriceDataLoading}
          isError={isPriceDataError}
        />
        <CompanyInfo
          tickerDetail={tickerDetail || null}
          isLoading={isTickerDetailLoading}
          isError={isTickerDetailError}
        />

        <RSI symbol={symbol} />
        <MACD symbol={symbol} />
        <SMA symbol={symbol} />
      </div>
    </div>
  )
}
