export const CHART_COLORS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const

export const STOCK_LIMITS = {
  MAX_STOCKS: 5, // max number of stocks to compare
  MAX_DATA_POINTS: 500, // Full trading day + some buffer
  SEARCH_RESULTS_LIMIT: 20, // autocomplete limit
  DEBOUNCE_DELAY: 300,
} as const
