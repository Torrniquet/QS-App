import { useQuery } from '@tanstack/react-query'
import { stockDetailKeys } from '@/lib/queryKeys'
import { api } from '@/lib/api'

export function useTickerDetail(symbol: string | undefined) {
  return useQuery({
    queryKey: stockDetailKeys.company(symbol as string),
    queryFn: () => api.getTickerDetail(symbol as string),
    enabled: !!symbol,
  })
}
