import { useQuery } from '@tanstack/react-query'
import { rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import {
  getTimeframeConfig,
  Timeframe,
} from '@/pages/stock-detail/utils/timeframe'
import { z } from 'zod'

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
        timestamp: config.from,
        window: STANDARD_SMA_PERIOD,
        series_type: CLOSE_PRICE_SERIES_TYPE,
      })

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
