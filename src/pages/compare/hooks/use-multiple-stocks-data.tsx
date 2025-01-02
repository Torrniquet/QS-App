import { Timeframe } from '@/lib/timeframe'
import {
  chartDataWebSocketMessageSchema,
  ConnectionState,
  polygonWS,
  Subscription,
  WebSocketMessage,
} from '@/lib/websocket'
import { useQuery } from '@tanstack/react-query'
import { multiStockKeys } from '@/lib/queryKeys'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChartDataPoint, MultipleStocksData } from '@/lib/schemas'
import { STOCK_LIMITS } from '../constants'
import { api } from '@/lib/api'
import { THROTTLE_TIME_FOR_REAL_TIME_DATA } from '@/lib/constants'
import { throttle } from 'lodash'
import { normalizeMultipleStocksData } from '@/lib/utils'

export function useMultipleStockData({
  stocks,
  timeframe,
}: {
  stocks: Array<string>
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
  } = useQuery({
    queryKey: multiStockKeys.byStocks(stocks, timeframe),
    queryFn: () => api.getMultipleStockData(stocks, timeframe),
    enabled: stocks.length > 0,
  })

  useEffect(() => {
    if (historicalData) setRealtimeData(historicalData)
  }, [historicalData])

  const pendingUpdatesRef = useRef<Record<string, Array<ChartDataPoint>>>({})

  const throttledProcessUpdates = useCallback(
    throttle(
      (
        batchedUpdates: Record<string, Array<ChartDataPoint>>,
        currentData: MultipleStocksData
      ) => {
        // First, merge current and new data for each symbol
        // In the end we need to process all the data to ensure it looks good from
        // beginning to end and timestamps aren't messed up
        const dataWithNewPoints = Object.entries(batchedUpdates).reduce(
          (acc, [symbol, newPoints]) => ({
            ...acc,
            [symbol]: [...(currentData[symbol] || []), ...newPoints].slice(
              -STOCK_LIMITS.MAX_DATA_POINTS
            ),
          }),
          { ...currentData }
        )

        // Then normalize the merged data
        const finalData = normalizeMultipleStocksData(dataWithNewPoints)

        setRealtimeData(finalData)
        pendingUpdatesRef.current = {}
      },
      THROTTLE_TIME_FOR_REAL_TIME_DATA
    ),
    []
  )

  const isRealtime = timeframe === '1D'
  useEffect(() => {
    if (!stocks.length || !isRealtime) return

    const subscription = stocks
      .map((stock) => `A.${stock}`)
      .join(',') as Subscription<string>

    polygonWS.addConnectionStateHandler(setConnectionState)

    const messageHandler = (messages: Array<WebSocketMessage>) => {
      messages.forEach((msg) => {
        const parsedMsg = chartDataWebSocketMessageSchema.parse(msg)
        const symbol = parsedMsg.sym

        const dataPoint: ChartDataPoint = {
          c: parsedMsg.c,
          h: parsedMsg.h,
          l: parsedMsg.l,
          o: parsedMsg.o,
          v: parsedMsg.v,
          t: parsedMsg.s,
          vw: parsedMsg.vw,
        }

        pendingUpdatesRef.current = {
          ...pendingUpdatesRef.current,
          [symbol]: [...(pendingUpdatesRef.current[symbol] || []), dataPoint],
        }
      })

      throttledProcessUpdates(pendingUpdatesRef.current, realtimeData)
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [isRealtime, realtimeData, stocks, throttledProcessUpdates])

  return {
    multipleStocksData: isRealtime ? realtimeData : historicalData,
    isMultipleStocksDataRealtime: isRealtime,
    isInitialMultipleStocksDataLoading: isLoadingHistorical,
    multipleStocksDataConnectionState: connectionState,
    isMultipleStocksDataError: isError,
  }
}
