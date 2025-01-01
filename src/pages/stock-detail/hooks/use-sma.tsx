import { useQuery } from '@tanstack/react-query'
import { stockDetailKeys } from '@/lib/queryKeys'
import { Timeframe } from '@/lib/timeframe'
import { api } from '@/lib/api'

export function useSMA({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  return useQuery({
    queryKey: stockDetailKeys.technicals.sma(symbol as string, timeframe),
    queryFn: () => api.getSMAData(symbol as string, timeframe),
    enabled: !!symbol,
  })
}
