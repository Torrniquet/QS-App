export const STOCK_CHART_COMPARISON_COLORS = [
  '--stock-comparison-chart-1',
  '--stock-comparison-chart-2',
  '--stock-comparison-chart-3',
  '--stock-comparison-chart-4',
  '--stock-comparison-chart-5',
] as const

/**
 * Configuration limits for stock-related operations
 */
export const STOCK_LIMITS = {
  /** Maximum number of stocks that can be compared simultaneously */
  MAX_STOCKS: 5,

  /**
   * Maximum number of data points to fetch/display
   * Sized to accommodate a full trading day plus buffer
   */
  MAX_DATA_POINTS: 500,

  /** Maximum number of results to show in autocomplete search */
  SEARCH_RESULTS_LIMIT: 20,

  /** Delay in milliseconds before triggering search after user input */
  DEBOUNCE_DELAY: 300,
} as const
