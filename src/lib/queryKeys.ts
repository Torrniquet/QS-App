import { StockFilters } from './schemas'

export const stockKeys = {
  all: ['stocks'] as const,
  popular: () => [...stockKeys.all, 'popular-stocks'] as const,
  filtered: (filters: StockFilters) => [...stockKeys.all, filters] as const,
}

export const snapshotKeys = {
  all: ['snapshots'] as const,
  popular: () => [...snapshotKeys.all, 'popular-stocks'] as const,
}

export const stockDetailKeys = {
  all: ['stock-detail'] as const,
  bySymbol: (symbol: string) => [...stockDetailKeys.all, symbol] as const,
  // Now nest the specific data types under the symbol
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

export const TIMEFRAME_KEY = ['timeframe'] as const
