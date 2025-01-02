import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
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
import { THROTTLE_TIME_FOR_REAL_TIME_DATA } from '@/lib/constants'

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

  const {
    data: initialSnapshot,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: stockDetailKeys.price(symbol as string, timeframe),
    queryFn: () => api.getPriceData(symbol as string, timeframe),
    enabled: !!symbol,
  })

  const [liveData, setLiveData] = useState<PriceData | null>(
    initialSnapshot || null
  )

  useEffect(() => {
    if (initialSnapshot) setLiveData(initialSnapshot)
  }, [initialSnapshot])

  // To batch updates
  // This is so we don't lose data since we're throttling
  const pendingUpdatesRef = useRef<Array<PriceDataWebSocketMessage>>([])

  // Hooks rule will complain here saying deps are unknown
  // However this is fine
  // Set state is referentially stable across re renders
  // Meaning it won't change and trigger re renders
  // So this is safe, and we can ignore the warning
  const throttledProcessUpdates = useCallback(
    throttle(
      (
        batchedNewMessages: Array<PriceDataWebSocketMessage>,
        existingMessages: PriceData | null
      ) => {
        if (!existingMessages) return

        // Get the latest message for price/timestamp
        const latestMsg = batchedNewMessages.at(-1)

        // should never happen
        if (!latestMsg) return

        // Create new trades once
        const newTrades = batchedNewMessages.map((message) => ({
          price: message.p,
          size: message.s,
          timestamp: message.t,
          conditions: message.c || [],
        }))

        const batchVolume = batchedNewMessages.reduce(
          (sum, msg) => sum + msg.s,
          0
        )

        const updatedData = {
          ...existingMessages,
          price: latestMsg.p, // Use latest price
          volume: existingMessages.volume + batchVolume,
          lastUpdate: latestMsg.t,
          trades: [...newTrades, ...existingMessages.trades].slice(
            0,
            MAX_TRADES
          ),
        }

        setLiveData(updatedData)
        pendingUpdatesRef.current = []
      },
      THROTTLE_TIME_FOR_REAL_TIME_DATA
    ),
    []
  )

  const isRealtime = timeframe === '1D'
  useEffect(() => {
    if (!symbol || !initialSnapshot || !isRealtime) return

    const subscription = `T.${symbol}` as const

    polygonWS.addConnectionStateHandler(setConnectionState)

    // Handle messages
    const messageHandler = (messages: Array<WebSocketMessage>) => {
      messages.forEach((msg) => {
        // Since a specific subscription
        // We can be sure that the message is a price data message
        const parsedMsg = priceDataWebSocketMessageSchema.parse(msg)
        pendingUpdatesRef.current = [...pendingUpdatesRef.current, parsedMsg]
      })

      throttledProcessUpdates(pendingUpdatesRef.current, liveData)
    }

    polygonWS.addMessageHandler(subscription, messageHandler)
    polygonWS.subscribe(subscription)

    return () => {
      polygonWS.removeMessageHandler(subscription, messageHandler)
      polygonWS.unsubscribe(subscription)
    }
  }, [isRealtime, liveData, initialSnapshot, symbol, throttledProcessUpdates])

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
