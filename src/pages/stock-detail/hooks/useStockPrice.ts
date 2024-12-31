import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { stockDetailKeys } from '@/lib/queryKeys'
import { Timeframe } from '@/lib/timeframe'
import {
  ConnectionState,
  polygonWS,
  priceDataWebSocketMessageSchema,
  Subscription,
  WebSocketMessage,
} from '@/lib/websocket'
import { PriceData } from '@/lib/schemas'
import { api } from '@/lib/api'

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
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: stockDetailKeys.price(symbol as string),
    queryFn: () => api.getPriceData(symbol as string),
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
    isPriceDataError: isError,
    priceDataError: error,
  }
}
