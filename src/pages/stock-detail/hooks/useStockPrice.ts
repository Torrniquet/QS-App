import { useQuery } from '@tanstack/react-query'
import { useRef, useState, useEffect } from 'react'
import { wsClient, rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import { IMessageEvent, w3cwebsocket } from 'websocket'
import { Timeframe } from '../timeframe'
import { format } from 'date-fns'

export type Trade = {
  price: number
  size: number
  timestamp: number
  conditions: number[]
}

export type PriceData = {
  price: number
  change: number
  changePercent: number
  volume: number
  lastUpdate: number
  trades: Trade[]
  previousClose: number
  dayOpen: number
}

// I don't wanna do this
// But the SDK sucks
type WebSocketMessage = {
  ev: 'T'
  sym: string
  p: number // price
  s: number // size
  t: number // timestamp
  c: number[] // conditions
}

type WebSocketAction = {
  action: 'subscribe'
  params: `T.${string}`
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected'

export function useStockPrice({
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

  // Get initial snapshot
  const { data: snapshot, isLoading } = useQuery({
    queryKey: stockDetailKeys.price(symbol as string),
    queryFn: async () => {
      const todayFormatted = format(new Date(), 'yyyy-MM-dd')

      const [snapshotResponse, tradesResponse] = await Promise.all([
        rest.stocks.snapshotTicker(symbol as string),
        rest.stocks.trades(symbol as string, {
          limit: 30,
          timestamp: todayFormatted,
        }),
      ])

      const ticker = snapshotResponse.ticker
      if (!ticker?.lastTrade?.p || !ticker?.prevDay?.c)
        throw new Error('No data')

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
    enabled: !!symbol,
  })

  const [liveData, setLiveData] = useState<PriceData | null>(snapshot || null)

  useEffect(() => {
    if (snapshot) setLiveData(snapshot)
  }, [snapshot])

  useEffect(() => {
    if (!symbol || !snapshot || timeframe !== '1D') return

    const connect = () => {
      const ws = wsClient.stocks()
      wsRef.current = ws
      setConnectionState('connecting')
      ws.onmessage = (event: IMessageEvent) => {
        const messages = JSON.parse(event.data as string) as WebSocketMessage[]

        messages.forEach((msg) => {
          const isStockMessage = msg.ev === 'T' && msg.sym === symbol

          if (isStockMessage) {
            setLiveData((prev) => {
              if (!prev) return null
              return {
                ...prev,
                price: msg.p,
                volume: prev.volume + msg.s,
                lastUpdate: msg.t,
                trades: [
                  {
                    price: msg.p,
                    size: msg.s,
                    timestamp: msg.t,
                    conditions: msg.c || [],
                  },
                  // Keep last 30 trades
                  ...prev.trades.slice(0, 29),
                ],
              }
            })
          }
        })
      }

      ws.onopen = () => {
        setConnectionState('connected')
        const action: WebSocketAction = {
          action: 'subscribe',
          params: `T.${symbol}`,
        }
        ws.send(JSON.stringify(action))
        reconnectAttempts.current = 0
      }

      ws.onclose = () => {
        setConnectionState('disconnected')
        if (reconnectAttempts.current < 5) {
          console.log('Reconnecting socket...')
          reconnectAttempts.current++
          setTimeout(connect, 1000 * reconnectAttempts.current)
        }
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [symbol, snapshot, timeframe])

  return {
    priceData: liveData,
    isLoadingInitialPriceData: isLoading,
    isTradeSocketConnected: connectionState === 'connected',
    isTradeSocketConnecting: connectionState === 'connecting',
    isTradeSocketDisconnected: connectionState === 'disconnected',
  }
}
