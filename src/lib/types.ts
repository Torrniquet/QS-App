export type StockFilters = {
  search?: string
  exchange?: string
}

export type Stock = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}
