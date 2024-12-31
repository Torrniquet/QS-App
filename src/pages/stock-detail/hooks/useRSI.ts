import { useQuery } from '@tanstack/react-query'
import { stockDetailKeys } from '@/lib/queryKeys'
import { Timeframe } from '@/lib/timeframe'
import { api } from '@/lib/api'

export function useRSI({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  return useQuery({
    queryKey: stockDetailKeys.technicals.rsi(symbol as string, timeframe),
    queryFn: () => api.getRSIData(symbol as string, timeframe),
    enabled: !!symbol,
  })
}
