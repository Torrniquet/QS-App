import { getTimeframeConfig, Timeframe } from '@/lib/timeframe'
import {
  chartDataPointSchema,
  tickerDetailSchema,
  PriceData,
  macdResultSchema,
  rsiResultSchema,
  smaResultSchema,
  MultipleStocksData,
} from './schemas'
import { rest } from './sdk'
import { z } from 'zod'
import { format } from 'date-fns'
import { TECHNICAL_INDICATOR_DATA_LIMIT } from './constants'

const STANDARD_MACD_SHORT_WINDOW = 12
const STANDARD_MACD_LONG_WINDOW = 26
const STANDARD_MACD_SIGNAL_WINDOW = 9
const CLOSE_PRICE_SERIES_TYPE = 'close'

const STANDARD_RSI_PERIOD = 14

const STANDARD_SMA_PERIOD = 20

export const api = {
  getTickerDetail: async (symbol: string) => {
    const response = await rest.reference.tickerDetails(symbol)

    const tickerDetail = tickerDetailSchema.safeParse(response.results)
    if (!tickerDetail.success) {
      throw new Error('Invalid response')
    }
    return tickerDetail.data
  },

  getChartData: async (symbol: string, timeframe: Timeframe) => {
    const config = getTimeframeConfig(timeframe)
    const response = await rest.stocks.aggregates(
      symbol,
      config.multiplier,
      config.timespan,
      config.from,
      config.to
    )

    const parsedResults = z
      .array(chartDataPointSchema)
      .safeParse(response.results)

    if (!parsedResults.success) throw new Error('Invalid data')

    return parsedResults.data
  },

  getPriceData: async (symbol: string) => {
    const todayFormatted = format(new Date(), 'yyyy-MM-dd')

    const [snapshotResponse, tradesResponse] = await Promise.all([
      rest.stocks.snapshotTicker(symbol),
      rest.stocks.trades(symbol, {
        limit: 30,
        timestamp: todayFormatted,
      }),
    ])

    const ticker = snapshotResponse.ticker
    if (!ticker?.lastTrade?.p || !ticker?.prevDay?.c) throw new Error('No data')

    const changeInDecimals =
      (ticker.lastTrade.p - ticker.prevDay.c) / ticker.prevDay.c

    return {
      price: ticker.lastTrade.p,
      change: ticker.lastTrade.p - ticker.prevDay.c,
      changePercent: changeInDecimals * 100,
      volume: ticker.day?.v || 0,
      lastUpdate: ticker.lastTrade.t || 0,
      previousClose: ticker.prevDay.c,
      dayOpen: ticker.day?.o || ticker.prevDay.c,
      trades:
        tradesResponse.results?.map((trade) => ({
          price: trade.price,
          size: trade.size,
          timestamp: trade.participant_timestamp,
          conditions: trade.conditions || [],
        })) || [],
    } satisfies PriceData
  },

  getMACDData: async (symbol: string, timeframe: Timeframe) => {
    const config = getTimeframeConfig(timeframe)
    const response = await rest.stocks.macd(symbol, {
      timespan: config.timespan,
      'timestamp.gte': config.from,
      'timestamp.lte': config.to,
      short_window: STANDARD_MACD_SHORT_WINDOW,
      long_window: STANDARD_MACD_LONG_WINDOW,
      signal_window: STANDARD_MACD_SIGNAL_WINDOW,
      series_type: CLOSE_PRICE_SERIES_TYPE,
      order: 'asc',
      limit: TECHNICAL_INDICATOR_DATA_LIMIT,
    })

    if (!response.results) throw new Error('No MACD data')

    const parsedResults = z
      .array(macdResultSchema)
      .safeParse(response.results.values)

    if (!parsedResults.success) throw new Error('Invalid MACD data')

    return parsedResults.data
  },

  getRSIData: async (symbol: string, timeframe: Timeframe) => {
    const config = getTimeframeConfig(timeframe)
    const response = await rest.stocks.rsi(symbol, {
      timespan: config.timespan,
      'timestamp.gte': config.from,
      'timestamp.lte': config.to,
      window: STANDARD_RSI_PERIOD,
      series_type: CLOSE_PRICE_SERIES_TYPE,
      limit: TECHNICAL_INDICATOR_DATA_LIMIT,
      order: 'asc',
    })

    if (!response.results) throw new Error('No RSI data')

    const parsedResults = z
      .array(rsiResultSchema)
      .safeParse(response.results.values)

    if (!parsedResults.success) throw new Error('Invalid RSI data')

    return parsedResults.data
  },
  getSMAData: async (symbol: string, timeframe: Timeframe) => {
    const config = getTimeframeConfig(timeframe)
    const response = await rest.stocks.sma(symbol, {
      timespan: config.timespan,
      'timestamp.gte': config.from,
      'timestamp.lte': config.to,
      window: STANDARD_SMA_PERIOD,
      series_type: CLOSE_PRICE_SERIES_TYPE,
      order: 'asc',
      limit: TECHNICAL_INDICATOR_DATA_LIMIT,
    })

    if (!response.results) throw new Error('No SMA data')

    const parsedResults = z
      .array(smaResultSchema)
      .safeParse(response.results.values)

    if (!parsedResults.success) throw new Error('Invalid SMA data')

    return parsedResults.data
  },
  getMultipleStockData: async (
    symbols: Array<string>,
    timeframe: Timeframe
  ) => {
    const dataArrays = await Promise.all(
      symbols.map((symbol) => api.getChartData(symbol, timeframe))
    )

    return symbols.reduce((acc, symbol, index) => {
      acc[symbol] = dataArrays[index]
      return acc
    }, {} as MultipleStocksData)
  },
}
