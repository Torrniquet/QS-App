import { clsx, type ClassValue } from 'clsx'
import { Stock } from '@/lib/schemas'
import { ISnapshot } from '@polygon.io/client-js'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Snapshot = ISnapshot['ticker']

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

export function createStockLookupMap<SnapshotInfo>({
  items,
  getKey,
}: {
  items: SnapshotInfo[]
  getKey: (item: SnapshotInfo) => string
}): Map<string, SnapshotInfo> {
  return new Map(items.map((item) => [getKey(item), item]))
}
