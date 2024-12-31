import { useQuery } from '@tanstack/react-query'
import { rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import { getTimeframeConfig, Timeframe } from '@/pages/stock-detail/timeframe'
import { z } from 'zod'
import { TECHNICAL_INDICATOR_DATA_LIMIT } from '../constants'

const smaResultSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
})

const STANDARD_SMA_PERIOD = 20
const CLOSE_PRICE_SERIES_TYPE = 'close'

export function useSMA({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  return useQuery({
    queryKey: stockDetailKeys.technicals.sma(symbol as string, timeframe),
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required')

      const config = getTimeframeConfig(timeframe)
      const response = await rest.stocks.sma(symbol, {
        timespan: config.timespan,
        'timestamp.gte': config.from,
        'timestamp.lte': config.to,
        window: STANDARD_SMA_PERIOD,
        series_type: CLOSE_PRICE_SERIES_TYPE,
        order: 'asc',
        limit: TECHNICAL_INDICATOR_DATA_LIMIT,
      })

      console.log('length sma', response.results?.values.length)

      if (!response.results) throw new Error('No SMA data')

      const parsedResults = z
        .array(smaResultSchema)
        .safeParse(response.results.values)

      if (!parsedResults.success) throw new Error('Invalid SMA data')

      return parsedResults.data
    },
    enabled: !!symbol,
  })
}
