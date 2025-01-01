import { z } from 'zod'

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

export const tickerDetailSchema = z.object({
  ticker: z.string(),
  description: z.string(),
  market_cap: z.number(),
  name: z.string(),
})

export type TickerDetail = z.infer<typeof tickerDetailSchema>

export const chartDataPointSchema = z.object({
  c: z.number(),
  h: z.number(),
  l: z.number(),
  o: z.number(),
  v: z.number(),
  t: z.number(),
  vw: z.number().optional(),
})

export type ChartDataPoint = z.infer<typeof chartDataPointSchema>

export type Trade = {
  price: number
  size: number
  timestamp: number
  conditions: Array<number>
}

export type PriceData = {
  price: number
  change: number
  changePercent: number
  volume: number
  lastUpdate: number
  trades: Array<Trade>
  previousClose: number
  dayOpen: number
}

export const macdResultSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
  signal: z.number(),
  histogram: z.number(),
})

export const rsiResultSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
})

export const smaResultSchema = z.object({
  timestamp: z.number(),
  value: z.number(),
})

export type MultipleStocksData = Record<string, Array<ChartDataPoint>>
