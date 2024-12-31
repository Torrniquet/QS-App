import { useQuery } from '@tanstack/react-query'
import { rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import { z } from 'zod'

const tickerDetailSchema = z.object({
  ticker: z.string(),
  description: z.string(),
  market_cap: z.number(),
  name: z.string(),
})

export type TickerDetail = z.infer<typeof tickerDetailSchema>

export function useTickerDetail(symbol: string | undefined) {
  return useQuery({
    queryKey: stockDetailKeys.company(symbol as string),
    queryFn: async () => {
      const response = await rest.reference.tickerDetails(symbol as string)

      const tickerDetail = tickerDetailSchema.safeParse(response.results)
      if (!tickerDetail.success) {
        throw new Error('Invalid response')
      }
      return tickerDetail.data
    },
    enabled: !!symbol,
  })
}
