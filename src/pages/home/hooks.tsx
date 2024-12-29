import { restClient, ITickersQuery, ISnapshot } from '@polygon.io/client-js'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

const rest = restClient(import.meta.env.VITE_API_POLY_KEY)

// TODO: extract into constants file later
// const ONE_SECOND_IN_MS = 1000
// const TWENTY_SECONDS_IN_MS = 20 * ONE_SECOND_IN_MS
// const THIRTY_SECONDS_IN_MS = 30 * ONE_SECOND_IN_MS

export type StockFilters = {
  search?: string
  exchange?: string
}

// Keys for React Query cache management
// TODO: extract into its own file later
export const stockKeys = {
  all: ['stocks'] as const,
  popular: () => [...stockKeys.all, 'popular-stocks'] as const,
  filtered: (filters: StockFilters) => [...stockKeys.all, filters] as const,
}

const snapshotKeys = {
  all: ['snapshots'] as const,
  popular: () => [...snapshotKeys.all, 'popular-stocks'] as const,
  filtered: (tickers: string[]) =>
    [...snapshotKeys.all, tickers.join(',')] as const,
}

type Snapshot = ISnapshot['ticker']

function transformStockData(
  snapshot: Snapshot,
  tickerDetails?: { name: string }
): Stock {
  // Should never happen
  // I still wanna use a type from the SDK to keep things type safe
  if (!snapshot) throw new Error('Snapshot is undefined')

  return {
    symbol: snapshot.ticker!,
    name: tickerDetails?.name || 'Unknown',
    price: snapshot.day?.c || 0,
    change: snapshot.todaysChange || 0,
    changePercent: snapshot.todaysChangePerc || 0,
    volume: snapshot.day?.v || 0,
  }
}

function createLookupMap<SnapshotInfo>({
  items,
  getKey,
}: {
  items: SnapshotInfo[]
  getKey: (item: SnapshotInfo) => string
}): Map<string, SnapshotInfo> {
  return new Map(items.map((item) => [getKey(item), item]))
}

export type Stock = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

// To scope this side project down to stocks only
// You could of course expand if you wish
// but it could become pretty big haha
const BASE_STOCK_FILTERS = {
  active: 'true',
  market: 'stocks',
  type: 'CS',
} as const

export function useSearchStocks(filters: StockFilters) {
  return useInfiniteQuery({
    queryKey: stockKeys.filtered(filters),
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

      const snapshotMap = createLookupMap({
        items: snapshotsResponse.tickers || [],
        getKey: (snapshot) => snapshot.ticker!,
      })

      const tickerDetailsMap = createLookupMap({
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

export const POPULAR_STOCKS_COUNT = 8

export function usePopularStocks() {
  const POPULAR_TICKERS = 'AAPL,MSFT,GOOGL,AMZN,META,NVDA,TSLA,BRK.A'

  const { data: tickerDetails } = useQuery({
    queryKey: stockKeys.popular(),
    queryFn: async () => {
      // Try individual requests for better reliability
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
