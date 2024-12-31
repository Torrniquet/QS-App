import { useQuery } from '@tanstack/react-query'
import { rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import { getTimeframeConfig, Timeframe } from '@/pages/stock-detail/timeframe'
import { z } from 'zod'

const macdResultSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
  signal: z.number(),
  histogram: z.number(),
})

const STANDARD_SHORT_WINDOW = 12
const STANDARD_LONG_WINDOW = 26
const STANDARD_SIGNAL_WINDOW = 9
const CLOSE_PRICE_SERIES_TYPE = 'close'

export function useMACD({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  return useQuery({
    queryKey: stockDetailKeys.technicals.macd(symbol as string, timeframe),
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required')

      const config = getTimeframeConfig(timeframe)
      const response = await rest.stocks.macd(symbol, {
        timespan: config.timespan,
        timestamp: config.from,
        short_window: STANDARD_SHORT_WINDOW,
        long_window: STANDARD_LONG_WINDOW,
        signal_window: STANDARD_SIGNAL_WINDOW,
        series_type: CLOSE_PRICE_SERIES_TYPE,
      })

      if (!response.results) throw new Error('No MACD data')

      const parsedResults = z
        .array(macdResultSchema)
        .safeParse(response.results.values)

      if (!parsedResults.success) throw new Error('Invalid MACD data')

      return parsedResults.data
    },
    enabled: !!symbol,
  })
}
