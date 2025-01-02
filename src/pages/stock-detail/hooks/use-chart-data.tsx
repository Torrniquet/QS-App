import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
import { throttle } from 'lodash'
import { Timeframe } from '@/lib/timeframe'
import { stockDetailKeys } from '@/lib/queryKeys'
import {
  chartDataWebSocketMessageSchema,
  ConnectionState,
  polygonWS,
  WebSocketMessage,
} from '@/lib/websocket'
import { ChartDataPoint } from '@/lib/schemas'
import { api } from '@/lib/api'
import {
  MAX_DATA_POINTS,
  THROTTLE_TIME_FOR_REAL_TIME_DATA,
} from '@/lib/constants'

export function useChartData({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected')
  const [realtimeData, setRealtimeData] = useState<Array<ChartDataPoint>>([])

  const {
    data: historicalData,
    isLoading: isLoadingHistorical,
    isError,
    error,
  } = useQuery({
    queryKey: stockDetailKeys.chart(symbol as string, timeframe),
    queryFn: () => api.getChartData(symbol as string, timeframe),
    enabled: !!symbol,
  })

  useEffect(() => {
    if (historicalData) setRealtimeData(historicalData)
  }, [historicalData])

  // To batch updates
  // This is so we don't lose data since we're throttling
  const pendingUpdatesRef = useRef<Array<ChartDataPoint>>([])

  // Hooks rule will complain here saying deps are unknown
  // However this is fine
  // Set state is referentially stable across re renders
  // Meaning it won't change and trigger re renders
  // So this is safe, and we can ignore the warning
  const throttledProcessUpdates = useCallback(
    throttle(
      (
        batchedNewPoints: Array<ChartDataPoint>,
        existingPoints: Array<ChartDataPoint>
      ) => {
        const updatedData = [...existingPoints, ...batchedNewPoints].slice(
          -MAX_DATA_POINTS
        )
        setRealtimeData(updatedData)
        pendingUpdatesRef.current = []
      },
      THROTTLE_TIME_FOR_REAL_TIME_DATA
    ),
    []
  )

  const isRealtime = timeframe === '1D'
  useEffect(() => {
    if (!symbol || !isRealtime) return

    const subscription = `A.${symbol}` as const

    polygonWS.addConnectionStateHandler(setConnectionState)

    const messageHandler = (messages: Array<WebSocketMessage>) => {
      messages.forEach((msg) => {
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
        pendingUpdatesRef.current = [...pendingUpdatesRef.current, dataPoint]
      })

      throttledProcessUpdates(pendingUpdatesRef.current, realtimeData)
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [isRealtime, realtimeData, symbol, throttledProcessUpdates])

  return {
    chartData: isRealtime ? realtimeData : historicalData,
    isInitialChartDataLoading: isRealtime ? false : isLoadingHistorical,
    isChartRealtime: isRealtime,
    chartConnectionState: connectionState,
    isChartDataError: isError,
    chartDataError: error,
  }
}
