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
  WATCHLIST: '/watchlist',
  COMPARE: '/compare',
  STOCK_DETAIL: '/stocks/:symbol',
  NOT_FOUND: '*',
} as const