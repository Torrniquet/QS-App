import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { rest } from '@/lib/api'
import { Timeframe, getTimeframeConfig } from '../timeframe'
import { z } from 'zod'
import { stockDetailKeys } from '@/lib/queryKeys'
import {
  chartDataWebSocketMessageSchema,
  ConnectionState,
  polygonWS,
  Subscription,
  WebSocketMessage,
} from '@/lib/websocket'

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

const MAX_DATA_POINTS = 500 // Full trading day + some buffer

export function useChartData({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected')
  const [realtimeData, setRealtimeData] = useState<ChartDataPoint[]>([])

  const { data: historicalData, isLoading: isLoadingHistorical } = useQuery({
    queryKey: stockDetailKeys.chart(symbol as string, timeframe),
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required')

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
    enabled: !!symbol,
  })

  useEffect(() => {
    if (historicalData) setRealtimeData(historicalData)
  }, [historicalData])

  const isRealtime = timeframe === '1D'
  // Replace the entire WebSocket effect with:
  useEffect(() => {
    if (!symbol || !isRealtime) return

    const subscription: Subscription = `A.${symbol}`

    polygonWS.addConnectionStateHandler(setConnectionState)

    const messageHandler = (messages: WebSocketMessage[]) => {
      messages.forEach((msg) => {
        console.log('msg', msg)

        const parsedMsg = chartDataWebSocketMessageSchema.parse(msg)

        const dataPoint: ChartDataPoint = {
          c: parsedMsg.c,
          h: parsedMsg.h,
          l: parsedMsg.l,
          o: parsedMsg.o,
          v: parsedMsg.v,
          t: parsedMsg.s,
          vw: parsedMsg.vw,
        }

        console.log('new data', dataPoint)

        setRealtimeData((prev) => {
          const newData = [...prev, dataPoint].slice(-MAX_DATA_POINTS)
          return newData
        })
      })
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [symbol, isRealtime])

  return {
    chartData: isRealtime ? realtimeData : historicalData,
    isInitialChartDataLoading: isRealtime ? false : isLoadingHistorical,
    isChartRealtime: isRealtime,
    isChartSocketConnected: connectionState === 'connected',
    isChartSocketConnecting: connectionState === 'connecting',
    isChartSocketDisconnected: connectionState === 'disconnected',
  }
}
