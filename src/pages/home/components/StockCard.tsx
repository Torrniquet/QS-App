import { Link } from 'react-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Stock } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTimeframe } from '@/hooks/use-timeframe'
import { stockDetailKeys } from '@/lib/queryKeys'
import { api } from '@/lib/api'

export function StockCard({ stock }: { stock: Stock }) {
  const queryClient = useQueryClient()
  const timeframe = useTimeframe()

  function prefetchStockDetail() {
    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.chart(stock.symbol, timeframe),
      queryFn: () => api.getChartData(stock.symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.technicals.macd(stock.symbol, timeframe),
      queryFn: () => api.getMACDData(stock.symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.technicals.sma(stock.symbol, timeframe),
      queryFn: () => api.getSMAData(stock.symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.technicals.rsi(stock.symbol, timeframe),
      queryFn: () => api.getRSIData(stock.symbol, timeframe),
    })

    void queryClient.prefetchQuery({
      queryKey: stockDetailKeys.price(stock.symbol),
      queryFn: () => api.getPriceData(stock.symbol),
    })
  }

  return (
    <Card key={stock.symbol} className="transition-shadow hover:shadow-lg">
      <Link to={`/stocks/${stock.symbol}`} onMouseEnter={prefetchStockDetail}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{stock.symbol}</span>
            <span
              className={`text-lg ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              ${stock.price.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 line-clamp-2 h-10 pr-6 text-sm text-gray-600">
            {stock.name}
          </p>

          <div className="flex items-center justify-between">
            <span
              className={cn('flex items-center gap-1', {
                'text-green-600': stock.change >= 0,
                'text-red-600': stock.change < 0,
              })}
            >
              {stock.change >= 0 ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              )}
              ${stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
            <span className="text-sm text-gray-600">
              Vol: {(stock.volume / 10_000_000).toFixed(1)}M
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
