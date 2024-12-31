import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Timeframe } from '@/lib/timeframe'
import { stockDetailKeys } from '@/lib/queryKeys'
import {
  chartDataWebSocketMessageSchema,
  ConnectionState,
  polygonWS,
  Subscription,
  WebSocketMessage,
} from '@/lib/websocket'
import { ChartDataPoint } from '@/lib/schemas'
import { api } from '@/lib/api'

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
    queryFn: () => api.getChartData(symbol as string, timeframe),
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
