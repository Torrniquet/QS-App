import { rest } from '@/lib/api'
import { BASE_STOCK_FILTERS } from '@/lib/constants'
import { snapshotKeys, stockKeys } from '@/lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { transformStockData } from '../utils'
import { createLookupMap } from '../utils'

export const POPULAR_STOCKS_COUNT = 8

export function usePopularStocks() {
  const POPULAR_TICKERS = 'AAPL,MSFT,GOOGL,AMZN,META,NVDA,TSLA,BRK.A'

  const { data: tickerDetails } = useQuery({
    queryKey: stockKeys.popular(),
    queryFn: async () => {
      const tickers = POPULAR_TICKERS.split(',')

      // I don't want to do this
      // We need to do this because the API endpoint for tickers doesn't support one param for multiple tickers
      // See endpoint used under the hood: https://polygon.io/docs/stocks/get_v3_reference_tickers
      const responses = await Promise.all(
        tickers.map((ticker) =>
          rest.reference.tickers({
            ...BASE_STOCK_FILTERS,
            ticker, // exact match instead of 'tickers'
          })
        )
      )
      return responses.flatMap((r) => r.results)
    },
  })

  const {
    data: snapshots,
    isError,
    error,
    isLoading,
  } = useQuery({
    queryKey: snapshotKeys.popular(),
    queryFn: async () => {
      const response = await rest.stocks.snapshotAllTickers({
        tickers: POPULAR_TICKERS,
      })
      return response.tickers
    },
    // TODO: uncomment when in production
    // refetchInterval: TWENTY_SECONDS_IN_MS,
  })

  const popularStocks = useMemo(() => {
    if (!tickerDetails || !snapshots) return []

    const detailsMap = createLookupMap({
      items: tickerDetails,
      getKey: (t) => t.ticker,
    })

    return snapshots
      .filter((s) => s.day && s.prevDay)
      .map((snapshot) =>
        transformStockData(snapshot, detailsMap.get(snapshot.ticker!))
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, POPULAR_STOCKS_COUNT)
  }, [tickerDetails, snapshots])

  return {
    popularStocks,
    isPopularStocksError: isError,
    popularStocksError: error,
    isPopularStocksLoading: isLoading,
  }
}
