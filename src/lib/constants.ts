// To scope this side project down to stocks only
// You could of course expand if you wish
// but it could become pretty big haha
export const BASE_STOCK_FILTERS = {
  active: 'true',
  market: 'stocks',
  type: 'CS',
} as const

export const QUERY_PARAMS = {
  SEARCH: 'search',
  EXCHANGE: 'exchange',
} as const

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  BOOKMARKS: '/bookmarks',
  COMPARE: '/compare',
  STOCK_DETAIL: '/stocks/:symbol',
  NOT_FOUND: '*',
} as const

export const NUMBER_SCALES = {
  TRILLION: 1e12,
  BILLION: 1e9,
  MILLION: 1e6,
  THOUSAND: 1e3,
} as const

export const NUMBER_SUFFIXES = {
  TRILLION: 'T',
  BILLION: 'B',
  MILLION: 'M',
  THOUSAND: 'K',
} as const

/**
 * A number that is large enough but not unreadable when looking at a chart.
 */
export const TECHNICAL_INDICATOR_DATA_LIMIT = 200

/**
 * Throttle time for real-time data to not overwhelm browser.
 */
export const THROTTLE_TIME_FOR_REAL_TIME_DATA = 500

/**
 * Maximum number of data points to fetch/display
 * Sized to accommodate a full trading day plus buffer
 */
export const MAX_DATA_POINTS = 500
