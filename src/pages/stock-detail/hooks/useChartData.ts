import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { IMessageEvent, w3cwebsocket } from 'websocket'
import { rest, wsClient } from '@/lib/api'
import { Timeframe, getTimeframeConfig } from '../timeframe'
import { z } from 'zod'
import { stockDetailKeys } from '@/lib/queryKeys'

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

type WebSocketMessage = {
  ev: 'A' // Aggregate event
  sym: string
  v: number // volume
  vw: number // volume weighted average
  o: number // open
  c: number // close
  h: number // high
  l: number // low
  t: number // start timestamp
  n: number // number of transactions
}

type WebSocketAction = {
  action: 'subscribe'
  params: `A.${string}`
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected'

export function useChartData({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
  const wsRef = useRef<w3cwebsocket | null>(null)
  const reconnectAttempts = useRef(0)
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
  useEffect(() => {
    if (!symbol || !isRealtime) return

    const connect = () => {
      const ws = wsClient.stocks()
      wsRef.current = ws
      setConnectionState('connecting')

      ws.onmessage = (event: IMessageEvent) => {
        const messages = JSON.parse(event.data as string) as WebSocketMessage[]

        messages.forEach((msg) => {
          const isAggregateEvent = msg.ev === 'A' && msg.sym === symbol
          if (isAggregateEvent) {
            const dataPoint: ChartDataPoint = {
              c: msg.c,
              h: msg.h,
              l: msg.l,
              o: msg.o,
              v: msg.v,
              t: msg.t,
              vw: msg.vw,
            }

            setRealtimeData((prev) => {
              const newData = [...prev, dataPoint].slice(-MAX_DATA_POINTS)
              return newData
            })
          }
        })
      }

      ws.onopen = () => {
        setConnectionState('connected')
        const action: WebSocketAction = {
          action: 'subscribe',
          params: `A.${symbol}`,
        }

        console.log('chart data: connected to socket')

        ws.send(JSON.stringify(action))
        reconnectAttempts.current = 0
      }

      ws.onclose = () => {
        setConnectionState('disconnected')
        if (reconnectAttempts.current < 5) {
          console.log('chart data: reconnecting socket...')
          reconnectAttempts.current++
          setTimeout(connect, 1000 * reconnectAttempts.current)
        }
      }
    }

    connect()
    return () => wsRef.current?.close()
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
