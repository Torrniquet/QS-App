import { clsx, type ClassValue } from 'clsx'
import { ChartDataPoint, MultipleStocksData, Stock } from '@/lib/schemas'
import { ISnapshot } from '@polygon.io/client-js'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

type Snapshot = ISnapshot['ticker']

/**
 * Transforms stock data
 *
 * @param snapshot - Snapshot of the stock
 * @param tickerDetails - Details of the ticker
 * @returns - Transformed stock data
 */
export function transformStockData(
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

/**
 * Creates a lookup map for stock data
 *
 * @param items - Array of items to create a lookup map for
 * @param getKey - Function to get the key for each item
 * @returns - Lookup map for stock data
 */
export function createStockLookupMap<SnapshotInfo>({
  items,
  getKey,
}: {
  items: Array<SnapshotInfo>
  getKey: (item: SnapshotInfo) => string
}): Map<string, SnapshotInfo> {
  return new Map(items.map((item) => [getKey(item), item]))
}

/**
 * This function takes raw data points for multiple stocks
 * And ensures that all stocks have data points for all timestamps
 * If a stock is missing data for a timestamp, it uses the last known value
 * Unless it has no values yet (beginning of trading day)
 *
 * @param data - Raw data points for multiple stocks
 * @returns - Normalized data points for multiple stocks
 */
export function normalizeMultipleStocksData(
  data: MultipleStocksData
): MultipleStocksData {
  const allTimestamps = new Set<number>()

  // Get all unique timestamps and create a lookup map for each stock's points
  // This will end up like:
  // {
  //   'A.AAPL': {
  //     1719859200: { ... },
  //     1719859201: { ... },
  //     ...
  //   },
  //   ...
  // }
  const pointsBySymbolAndTimestamp = Object.entries(data).reduce(
    (currentObjWithAllPointsBySymbols, [symbol, points]) => {
      // Build lookup map for this symbol's points
      const pointMap = new Map<number, ChartDataPoint>()
      points.forEach((point) => {
        pointMap.set(point.t, point)
        allTimestamps.add(point.t)
      })

      return {
        ...currentObjWithAllPointsBySymbols,
        [symbol]: pointMap,
      }
    },
    {} as Record<string, Map<number, ChartDataPoint>>
  )

  // Sort timestamps once
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

  // Fill in missing points for each symbol
  // Will end up like:
  // {
  //   'A.AAPL': [
  //     { ... },
  //     { ... },
  //     ...
  //   ],
  //   ...
  // }
  // This is what's used as chart data
  return Object.entries(pointsBySymbolAndTimestamp).reduce(
    (acc, [symbol, pointMap]) => {
      let lastPoint: ChartDataPoint | null = null

      const filledPoints = sortedTimestamps
        .map((timestamp) => {
          const pointForCurrentTimestamp = pointMap.get(timestamp)

          // If we have one
          // Great, return it or the map
          if (pointForCurrentTimestamp) {
            lastPoint = pointForCurrentTimestamp
            return pointForCurrentTimestamp
          }

          // If not return null
          // Need to filter out nulls later
          // This can happen if the stock market has started
          // Let's say apple and google have started trading
          // But Meta has no trades yet
          // Then it is right to show meta as 0 while it doesn't have any trades
          // My point?
          // In the beginning of the stock market, when comparing stocks, in the beginning of the day, some stocks will have no trades
          // UI-wise doesn't look the best, but this is how it is as a fact
          if (!lastPoint) return null

          // If we have had a last point
          // Return it with the timestamp
          return {
            ...lastPoint,
            t: timestamp,
          }
        })
        .filter((point): point is ChartDataPoint => point !== null)

      return {
        ...acc,
        [symbol]: filledPoints,
      }
    },
    {} as MultipleStocksData
  )
}
