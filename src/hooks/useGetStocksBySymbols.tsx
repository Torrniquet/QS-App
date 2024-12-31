import { rest } from '@/lib/sdk'
import { BASE_STOCK_FILTERS } from '@/lib/constants'
import { QueryKey, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { transformStockData, createStockLookupMap } from '@/lib/utils'

export function useGetStocksBySymbols({
  tickers,
  tickerQueryKey,
  snapshotQueryKey,
  limit,
  enabled = true,
}: {
  tickers: Array<string>
  tickerQueryKey: QueryKey
  snapshotQueryKey: QueryKey
  limit?: number
  enabled?: boolean
}) {
  const { data: tickerDetails } = useQuery({
    queryKey: tickerQueryKey,
    queryFn: async () => {
      // I don't want to do this
      // We need to do this because the API endpoint for tickers doesn't support one param for multiple tickers
      // See endpoint used under the hood: https://polygon.io/docs/stocks/get_v3_reference_tickers
      const responses = await Promise.all(
        tickers.map((ticker) =>
          rest.reference.tickers({
            ...BASE_STOCK_FILTERS,
            ticker,
          })
        )
      )
      return responses.flatMap((r) => r.results)
    },
    enabled,
  })

  const tickersJoined = tickers.join(',')

  const {
    data: snapshots,
    isError,
    error,
    isLoading,
  } = useQuery({
    queryKey: snapshotQueryKey,
    queryFn: async () => {
      const response = await rest.stocks.snapshotAllTickers({
        tickers: tickersJoined,
      })
      return response.tickers
    },
    enabled,
    // TODO: uncomment when in production
    // refetchInterval: TWENTY_SECONDS_IN_MS,
  })

  const stocks = useMemo(() => {
    if (!tickerDetails || !snapshots) return []

    const detailsMap = createStockLookupMap({
      items: tickerDetails,
      getKey: (t) => t.ticker,
    })

    let result = snapshots
      .filter((s) => s.day && s.prevDay)
      .map((snapshot) =>
        transformStockData(snapshot, detailsMap.get(snapshot.ticker!))
      )
      .sort((a, b) => a.name.localeCompare(b.name))

    if (limit !== undefined) {
      result = result.slice(0, limit)
    }

    return result
  }, [tickerDetails, snapshots, limit])

  return {
    stocks,
    isStocksError: isError,
    stocksError: error,
    isStocksLoading: isLoading,
  }
}
