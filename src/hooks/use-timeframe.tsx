import { TIMEFRAME_KEY } from '@/lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { Timeframe } from '@/lib/timeframe'

/**
 * This is a global store for the timeframe.
 * It should never expire
 */
export function useTimeframe() {
  const { data: timeframe } = useQuery({
    queryKey: TIMEFRAME_KEY,
    staleTime: Infinity,
    initialData: '1D' as Timeframe,
  })

  return timeframe
}
