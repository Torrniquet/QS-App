import { StockFilters } from './schemas'
import { Timeframe } from './timeframe'

export const tickerKeys = {
  all: ['stocks'] as const,
  popular: () => [...tickerKeys.all, 'popular-stocks'] as const,
  filtered: (filters: StockFilters) => [...tickerKeys.all, filters] as const,
  bookmarked: () => [...tickerKeys.all, 'bookmarked'] as const,
}

export const snapshotKeys = {
  all: ['snapshots'] as const,
  popular: () => [...snapshotKeys.all, 'popular-stocks'] as const,
  bookmarked: () => [...snapshotKeys.all, 'bookmarked'] as const,
}

export const stockDetailKeys = {
  all: ['stock-detail'] as const,
  bySymbol: (symbol: string) => [...stockDetailKeys.all, symbol] as const,
  company: (symbol: string) =>
    [...stockDetailKeys.bySymbol(symbol), 'company'] as const,
  price: (symbol: string) =>
    [...stockDetailKeys.bySymbol(symbol), 'price'] as const,
  chart: (symbol: string, timeframe: string) =>
    [...stockDetailKeys.bySymbol(symbol), 'chart', timeframe] as const,
  technicals: {
    rsi: (symbol: string, timeframe: string) =>
      [
        ...stockDetailKeys.bySymbol(symbol),
        'technicals',
        'rsi',
        timeframe,
      ] as const,
    macd: (symbol: string, timeframe: string) =>
      [
        ...stockDetailKeys.bySymbol(symbol),
        'technicals',
        'macd',
        timeframe,
      ] as const,
    sma: (symbol: string, timeframe: string) =>
      [
        ...stockDetailKeys.bySymbol(symbol),
        'technicals',
        'sma',
        timeframe,
      ] as const,
  },
}

export const multiStockKeys = {
  all: ['multi-stock'] as const,
  byStocks: (stocks: Array<string>, timeframe: Timeframe) =>
    [...multiStockKeys.all, stocks, timeframe] as const,
}

export const TIMEFRAME_KEY = ['timeframe'] as const
