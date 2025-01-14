import { rest } from '@/lib/sdk'
import { BASE_STOCK_FILTERS } from '@/lib/constants'
import { tickerKeys } from '@/lib/queryKeys'
import { StockFilters } from '@/lib/schemas'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ITickersQuery } from '@polygon.io/client-js'
import { createStockLookupMap, transformStockData } from '@/lib/utils'

export function useSearchStocks(filters: StockFilters) {
  return useInfiniteQuery({
    queryKey: tickerKeys.filtered(filters),
    queryFn: async ({ pageParam }) => {
      const tickersResponse = await rest.reference.tickers({
        ...BASE_STOCK_FILTERS,
        search: filters.search,
        exchange: filters.exchange,
        cursor: pageParam ?? undefined,
        limit: 50,
      })

      if (!tickersResponse.results?.length) {
        return {
          stocks: [],
          nextCursor: null,
        }
      }

      const tickers = tickersResponse.results.map((result) => result.ticker)

      const snapshotsResponse = await rest.stocks.snapshotAllTickers({
        tickers: tickers.join(','),
      })

      const snapshotMap = createStockLookupMap({
        items: snapshotsResponse.tickers || [],
        getKey: (snapshot) => snapshot.ticker!,
      })

      const tickerDetailsMap = createStockLookupMap({
        items: tickersResponse.results,
        getKey: (ticker) => ticker.ticker,
      })

      // Transform the data
      const stocks = tickers.map((ticker) =>
        transformStockData(
          snapshotMap.get(ticker) || { ticker },
          tickerDetailsMap.get(ticker)
        )
      )

      return {
        stocks,
        nextCursor: tickersResponse.next_url
          ? tickersResponse.next_url.split('cursor=')[1]
          : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as ITickersQuery['cursor'],
    enabled: !!filters.search,
  })
}
