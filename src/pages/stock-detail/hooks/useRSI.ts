import { useQuery } from '@tanstack/react-query'
import { rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import { z } from 'zod'
import { getTimeframeConfig, Timeframe } from '@/pages/stock-detail/timeframe'
import { TECHNICAL_INDICATOR_DATA_LIMIT } from '../constants'

const rsiResultSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
})

const STANDARD_RSI_PERIOD = 14
const CLOSE_PRICE_SERIES_TYPE = 'close'

export function useRSI({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  return useQuery({
    queryKey: stockDetailKeys.technicals.rsi(symbol as string, timeframe),
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required')

      const config = getTimeframeConfig(timeframe)
      const response = await rest.stocks.rsi(symbol, {
        timespan: config.timespan,
        'timestamp.gte': config.from,
        'timestamp.lte': config.to,
        window: STANDARD_RSI_PERIOD,
        series_type: CLOSE_PRICE_SERIES_TYPE,
        limit: TECHNICAL_INDICATOR_DATA_LIMIT,
        order: 'asc',
      })

      if (!response.results) throw new Error('No RSI data')

      const parsedResults = z
        .array(rsiResultSchema)
        .safeParse(response.results.values)

      if (!parsedResults.success) throw new Error('Invalid RSI data')

      return parsedResults.data
    },
    enabled: !!symbol,
  })
}
