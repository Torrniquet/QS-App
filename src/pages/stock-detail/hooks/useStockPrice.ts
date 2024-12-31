import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { rest } from '@/lib/api'
import { stockDetailKeys } from '@/lib/queryKeys'
import { Timeframe } from '../timeframe'
import { format } from 'date-fns'
import {
  ConnectionState,
  polygonWS,
  priceDataWebSocketMessageSchema,
  Subscription,
  WebSocketMessage,
} from '@/lib/websocket'

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

export function useStockPrice({
  symbol,
  timeframe,
}: {
  symbol: string | undefined
  timeframe: Timeframe
}) {
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

  const isRealtime = timeframe === '1D'
  // Replace the entire WebSocket effect with:
  useEffect(() => {
    if (!symbol || !snapshot || !isRealtime) return

    const subscription: Subscription = `T.${symbol}`

    // Handle connection state
    polygonWS.addConnectionStateHandler(setConnectionState)

    // Handle messages
    const messageHandler = (messages: WebSocketMessage[]) => {
      messages.forEach((msg) => {
        // Since a specific subscription
        // We can be sure that the message is a price data message
        const parsedMsg = priceDataWebSocketMessageSchema.parse(msg)

        setLiveData((prev) => {
          if (!prev) return null
          return {
            ...prev,
            price: parsedMsg.p,
            volume: prev.volume + parsedMsg.s,
            lastUpdate: parsedMsg.t,
            trades: [
              {
                price: parsedMsg.p,
                size: parsedMsg.s,
                timestamp: parsedMsg.t,
                conditions: parsedMsg.c || [],
              },
              ...prev.trades.slice(0, 29),
            ],
          }
        })
      })
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [symbol, snapshot, isRealtime])

  return {
    priceData: liveData,
    isPriceDataLoading: isLoading,
    isTradeSocketConnected: connectionState === 'connected',
    isTradeSocketConnecting: connectionState === 'connecting',
    isTradeSocketDisconnected: connectionState === 'disconnected',
  }
}
