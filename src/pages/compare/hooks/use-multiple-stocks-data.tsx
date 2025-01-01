import { Timeframe } from '@/lib/timeframe'
import {
  chartDataWebSocketMessageSchema,
  ConnectionState,
  polygonWS,
  Subscription,
  WebSocketMessage,
} from '@/lib/websocket'
import { MultipleStocksData } from '../types'
import { useQuery } from '@tanstack/react-query'
import { multiStockKeys } from '@/lib/queryKeys'
import { api } from '@/lib/api'
import { useEffect, useState } from 'react'
import { ChartDataPoint } from '@/lib/schemas'
import { STOCK_LIMITS } from '../constants'

export function useMultipleStockData({
  symbols,
  timeframe,
}: {
  symbols: string[]
  timeframe: Timeframe
}) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected')
  // Keep track of data for each symbol
  const [realtimeData, setRealtimeData] = useState<MultipleStocksData>({})

  const {
    data: historicalData,
    isLoading: isLoadingHistorical,
    isError,
    error,
  } = useQuery({
    queryKey: multiStockKeys.bySymbols(symbols, timeframe),
    queryFn: async () => {
      const dataArrays = await Promise.all(
        symbols.map((symbol) => api.getChartData(symbol, timeframe))
      )

      return symbols.reduce((acc, symbol, index) => {
        acc[symbol] = dataArrays[index]
        return acc
      }, {} as MultipleStocksData)
    },
    enabled: symbols.length > 0,
  })

  useEffect(() => {
    if (historicalData) setRealtimeData(historicalData)
  }, [historicalData])

  const isRealtime = timeframe === '1D'
  // Replace the entire WebSocket effect with:
  useEffect(() => {
    if (!symbols.length || !isRealtime) return

    const subscription = symbols
      .map((symbol) => `A.${symbol}`)
      .join(',') as Subscription<string>

    polygonWS.addConnectionStateHandler(setConnectionState)

    const messageHandler = (messages: WebSocketMessage[]) => {
      messages.forEach((msg) => {
        const parsedMsg = chartDataWebSocketMessageSchema.parse(msg)

        // Extract symbol from the message
        const symbol = parsedMsg.sym // assuming this is how Polygon provides the symbol

        const dataPoint: ChartDataPoint = {
          c: parsedMsg.c,
          h: parsedMsg.h,
          l: parsedMsg.l,
          o: parsedMsg.o,
          v: parsedMsg.v,
          t: parsedMsg.s,
          vw: parsedMsg.vw,
        }

        setRealtimeData((prev) => ({
          ...prev,
          [symbol]: [...(prev[symbol] || []), dataPoint].slice(
            -STOCK_LIMITS.MAX_DATA_POINTS
          ),
        }))
      })
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [symbols, isRealtime])

  return {
    multipleStocksData: isRealtime ? realtimeData : historicalData,
    isInitialMultipleStocksDataLoading: isLoadingHistorical,
    isMultipleStocksDataRealtime: isRealtime,
    multipleStocksDataConnectionState: connectionState,
    isMultipleStocksDataError: isError,
  }
}
