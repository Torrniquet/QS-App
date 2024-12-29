import { restClient, ITickersQuery, ISnapshot } from '@polygon.io/client-js'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

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

function createLookupMap<SnapshotInfo>(
  items: SnapshotInfo[],
  getKey: (item: SnapshotInfo) => string
): Map<string, SnapshotInfo> {
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

const BASE_STOCK_FILTERS = {
  active: 'true',
  market: 'stocks',
  type: 'CS',
} as const

export function useSearchStocks(filters: StockFilters) {
  // Keep the infinite query for tickers
  const tickersQuery = useInfiniteQuery({
    queryKey: stockKeys.filtered(filters),
    queryFn: async ({ pageParam }) => {
      const response = await rest.reference.tickers({
        ...BASE_STOCK_FILTERS,
        search: filters.search,
        exchange: filters.exchange,
        cursor: pageParam ?? undefined,
        limit: 50,
      })

      return {
        results: response.results,
        nextCursor: response.next_url
          ? response.next_url.split('cursor=')[1]
          : null,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as ITickersQuery['cursor'],
    enabled: !!filters.search,
  })

  // Instead of state for tracking status, use a ref to track processed tickers
  const processedTickersRef = useRef(new Set<string>())
  const [snapshotFetchStatus, setSnapshotFetchStatus] = useState<
    'idle' | 'fetching' | 'success' | 'error'
  >('idle')
  const [stocks, setStocks] = useState<Stock[]>([])

  // Effect to handle new tickers as they come in
  useEffect(() => {
    if (!tickersQuery.data?.pages) return

    // Get all new tickers we haven't processed yet
    const allTickers = tickersQuery.data.pages.flatMap((page) =>
      page.results.map((result) => result.ticker)
    )

    const newTickers = allTickers.filter(
      (ticker) => !processedTickersRef.current.has(ticker)
    )

    if (newTickers.length === 0 || snapshotFetchStatus === 'fetching') return

    // Fetch snapshots for new tickers only
    const fetchSnapshots = async () => {
      setSnapshotFetchStatus('fetching')
      const response = await rest.stocks.snapshotAllTickers({
        tickers: newTickers.join(','),
      })

      if (!response.tickers) {
        setSnapshotFetchStatus('error')
        return
      }

      // Create lookup maps
      const snapshotMap = createLookupMap(
        response.tickers,
        (snapshot) => snapshot.ticker!
      )

      const tickerDetailsMap = new Map(
        tickersQuery.data.pages.flatMap((page) =>
          page.results.map((ticker) => [ticker.ticker, ticker])
        )
      )

      // Transform and append new stocks
      const newStocks = newTickers.map((ticker) =>
        transformStockData(
          snapshotMap.get(ticker) || { ticker },
          tickerDetailsMap.get(ticker)
        )
      )

      // Mark these tickers as processed
      newTickers.forEach((ticker) => processedTickersRef.current.add(ticker))

      // Append new stocks to state
      setStocks((prev) => [...prev, ...newStocks])
    }

    fetchSnapshots()
      .then(() => setSnapshotFetchStatus('success'))
      .catch(() => setSnapshotFetchStatus('error'))
  }, [snapshotFetchStatus, tickersQuery.data?.pages])

  return {
    searchStocks: stocks,
    isSearchStocksLoading: tickersQuery.isLoading,
    searchStocksError: tickersQuery.error,
    isSearchStocksError: tickersQuery.isError,
    searchIsFetching: tickersQuery.isFetching,
    searchFetchNextPage: tickersQuery.fetchNextPage,
    searchHasNextPage: tickersQuery.hasNextPage,
    isSnapshotFetching: snapshotFetchStatus === 'fetching',
  }
}

export function usePopularStocks() {
  const POPULAR_TICKERS = 'AAPL,MSFT,GOOGL,AMZN,META,NVDA,TSLA,BRK.A'

  const { data: tickerDetails } = useQuery({
    queryKey: stockKeys.popular(),
    queryFn: async () => {
      // Try individual requests for better reliability
      const tickers = POPULAR_TICKERS.split(',')

      // I don't want to do this
      // We need to do this because the API endpoint for tickers doesn't support one param for multiple tickers
      // See endpoint used under the hood: /v3/reference/tickers
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

    const detailsMap = createLookupMap(tickerDetails, (t) => t.ticker)

    return snapshots
      .filter((s) => s.day && s.prevDay)
      .map((snapshot) =>
        transformStockData(snapshot, detailsMap.get(snapshot.ticker!))
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [tickerDetails, snapshots])

  return {
    popularStocks,
    isPopularStocksError: isError,
    popularStocksError: error,
    isPopularStocksLoading: isLoading,
  }
}
