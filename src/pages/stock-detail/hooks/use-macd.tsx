import { useQuery } from '@tanstack/react-query'
import { stockDetailKeys } from '@/lib/queryKeys'
import { Timeframe } from '@/lib/timeframe'
import { api } from '@/lib/api'

export function useMACD({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  return useQuery({
    queryKey: stockDetailKeys.technicals.macd(symbol as string, timeframe),
    queryFn: () => api.getMACDData(symbol as string, timeframe),
    enabled: !!symbol,
  })
}
