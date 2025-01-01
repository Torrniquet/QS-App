import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { stockDetailKeys } from '@/lib/queryKeys'
import { Timeframe } from '@/lib/timeframe'
import {
  ConnectionState,
  polygonWS,
  PriceDataWebSocketMessage,
  priceDataWebSocketMessageSchema,
  WebSocketMessage,
} from '@/lib/websocket'
import { PriceData } from '@/lib/schemas'
import { api } from '@/lib/api'
import { throttle } from 'lodash'
import { THROTTLE_TIME_FOR_REAL_TIME_DATA } from '../constants'

const MAX_TRADES = 500

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

  const throttledSetLiveData = useCallback(
    throttle((prevData: PriceData | null, msg: PriceDataWebSocketMessage) => {
      if (!prevData) return null
      return {
        ...prevData,
        price: msg.p,
        volume: prevData.volume + msg.s,
        lastUpdate: msg.t,
        trades: [
          {
            price: msg.p,
            size: msg.s,
            timestamp: msg.t,
            conditions: msg.c || [],
          },
          ...prevData.trades.slice(0, MAX_TRADES),
        ],
      }
    }, THROTTLE_TIME_FOR_REAL_TIME_DATA),
    []
  )

  const isRealtime = timeframe === '1D'
  // Replace the entire WebSocket effect with:
  useEffect(() => {
    if (!symbol || !snapshot || !isRealtime) return

    const subscription = `T.${symbol}` as const

    // Handle connection state
    polygonWS.addConnectionStateHandler(setConnectionState)

    // Handle messages
    const messageHandler = (messages: WebSocketMessage[]) => {
      messages.forEach((msg) => {
        // Since a specific subscription
        // We can be sure that the message is a price data message
        const parsedMsg = priceDataWebSocketMessageSchema.parse(msg)

        throttledSetLiveData(liveData, parsedMsg)
      })
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [symbol, snapshot, isRealtime, throttledSetLiveData, liveData])

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
