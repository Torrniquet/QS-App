import { StockFilters } from './types'

export const stockKeys = {
  all: ['stocks'] as const,
  popular: () => [...stockKeys.all, 'popular-stocks'] as const,
  filtered: (filters: StockFilters) => [...stockKeys.all, filters] as const,
}

export const snapshotKeys = {
  all: ['snapshots'] as const,
  popular: () => [...snapshotKeys.all, 'popular-stocks'] as const,
}
