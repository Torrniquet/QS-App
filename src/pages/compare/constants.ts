export const CHART_COLORS = [
  '--stock-comparison-chart-1',
  '--stock-comparison-chart-2',
  '--stock-comparison-chart-3',
  '--stock-comparison-chart-4',
  '--stock-comparison-chart-5',
] as const

export const STOCK_LIMITS = {
  MAX_STOCKS: 5, // max number of stocks to compare
  MAX_DATA_POINTS: 500, // Full trading day + some buffer
  SEARCH_RESULTS_LIMIT: 20, // autocomplete limit
  DEBOUNCE_DELAY: 300,
} as const
