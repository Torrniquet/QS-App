import { ChartDataPoint } from '@/lib/schemas'

export type StockResult = {
  symbol: string
  name: string
}

export type MultipleStocksData = Record<string, ChartDataPoint[]>
