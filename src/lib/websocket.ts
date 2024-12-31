import { wsClient } from '@/lib/sdk'
import { w3cwebsocket } from 'websocket'
import { z } from 'zod'
import { env } from './env'

export type Subscription = `T.${string}` | `A.${string}`

type AuthAction = {
  action: 'auth'
  params: string
}

type SubscribeTickerAction = {
  action: 'subscribe'
  params: Subscription
}

type UnsubscribeTickerAction = {
  action: 'unsubscribe'
  params: Subscription
}

type SubscribeAggregateAction = {
  action: 'subscribe'
  params: Subscription
}

type UnsubscribeAggregateAction = {
  action: 'unsubscribe'
  params: Subscription
}

type SocketActions =
  | SubscribeTickerAction
  | UnsubscribeTickerAction
  | SubscribeAggregateAction
  | UnsubscribeAggregateAction
  | AuthAction

const statusMessageSchema = z.object({
  ev: z.literal('status'),
  status: z.union([
    z.literal('auth_success'),
    z.literal('error'),
    z.literal('connected'),
    z.literal('success'),
    z.literal('max_connections'),
  ]),
  message: z.string(),
})

type StatusMessage = z.infer<typeof statusMessageSchema>

// Taken from the Polygon API docs: https://polygon.io/docs/stocks/ws_stocks_t
export const priceDataWebSocketMessageSchema = z.object({
  ev: z.literal('T'),
  sym: z.string(),
  x: z.number(), // exchange ID
  i: z.string(), // trade ID
  z: z.number(), // tape
  p: z.number(), // price
  s: z.number(), // size
  c: z.array(z.number()).optional(), // conditions
  t: z.number(), // timestamp
  q: z.number(), // sequence number
})

export type PriceDataWebSocketMessage = z.infer<
  typeof priceDataWebSocketMessageSchema
>

// Taken from the Polygon API docs: https://polygon.io/docs/stocks/ws_stocks_a
export const chartDataWebSocketMessageSchema = z.object({
  ev: z.literal('A'),
  sym: z.string(),
  v: z.number(), // volume
  av: z.number(), // accumulated volume
  op: z.number(), // official opening price
  vw: z.number(), // volume weighted price
  o: z.number(), // open
  c: z.number(), // close
  h: z.number(), // high
  l: z.number(), // low
  a: z.number(), // today's VWAP
  z: z.number(), // average trade size
  s: z.number(), // start timestamp
  e: z.number(), // end timestamp
})

export type ChartDataWebSocketMessage = z.infer<
  typeof chartDataWebSocketMessageSchema
>

const webSocketMessageSchema = z.union([
  priceDataWebSocketMessageSchema,
  chartDataWebSocketMessageSchema,
  statusMessageSchema,
])

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>

type MessageHandler = (
  messages: Array<PriceDataWebSocketMessage | ChartDataWebSocketMessage>
) => void
type ConnectionStateHandler = (state: ConnectionState) => void
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'authenticated'

class PolygonWebSocket {
  private ws: w3cwebsocket | null = null

  // Map of subscription to set of handlers
  // This lets multiple handlers listen to a single subscription
  private messageHandlers = new Map<Subscription, Set<MessageHandler>>()

  // Set of handlers for connection state changes
  // This isn't necessary for the ones using this ws instance
  // But if they wanna be informed of connection state changes, they can add a handler
  private connectionHandlers = new Set<ConnectionStateHandler>()

  private subscriptions = new Set<Subscription>()
  private reconnectAttempts = 0
  private connectionState: ConnectionState = 'disconnected'

  constructor() {
    this.connect()
  }

  private connect() {
    this.ws = wsClient.stocks()
    this.updateConnectionState('connecting')

    this.ws.onopen = () => {
      console.log('WebSocket Connected')
      this.updateConnectionState('connected')

      const authAction: AuthAction = {
        action: 'auth',
        params: env.VITE_API_POLY_KEY,
      }

      // We need to authenticate first
      this.ws?.send(JSON.stringify(authAction))

      // Resubscribe to all previous subscriptions after reconnect
      this.subscriptions.forEach((sub) => {
        this.subscribe(sub)
      })
    }

    this.ws.onmessage = (event) => {
      const messages = z
        .array(webSocketMessageSchema)
        .parse(JSON.parse(event.data as string))

      this.handleStatusMessages(messages)
      this.handleDataMessages(messages)
    }

    this.ws.onclose = () => {
      this.updateConnectionState('disconnected')
      if (this.reconnectAttempts < 5) {
        console.log('WebSocket disconnected, attempting to reconnect...')
        this.reconnectAttempts++
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
      }
    }
  }

  private isAuthenticated() {
    return this.connectionState === 'authenticated'
  }

  private handleDataMessages(messages: WebSocketMessage[]) {
    this.messageHandlers.forEach((handlers, subscription) => {
      const relevantMessages = messages.filter(
        (
          msg:
            | PriceDataWebSocketMessage
            | ChartDataWebSocketMessage
            | StatusMessage
        ): msg is PriceDataWebSocketMessage | ChartDataWebSocketMessage => {
          if (msg.ev === 'status') return false

          const [eventType, symbol] = subscription.split('.')
          return msg.ev === eventType && msg.sym === symbol
        }
      )

      if (relevantMessages.length > 0 && this.isAuthenticated()) {
        handlers.forEach((handler) => handler(relevantMessages))
      }
    })
  }

  private handleStatusMessages(messages: WebSocketMessage[]) {
    for (const msg of messages) {
      if (msg.ev === 'status' && msg.status === 'auth_success') {
        console.log('WebSocket Authenticated')
        this.updateConnectionState('authenticated')
        this.subscriptions.forEach((sub) => this.subscribe(sub))
        break // Since auth_success only happens once
      }
    }
  }

  private updateConnectionState(state: ConnectionState) {
    this.connectionState = state
    this.connectionHandlers.forEach((handler) => handler(state))
  }

  subscribe(subscription: Subscription) {
    this.subscriptions.add(subscription)
    if (this.isAuthenticated()) {
      const action: SocketActions = {
        action: 'subscribe',
        params: subscription,
      }
      this.ws?.send(JSON.stringify(action))
    }
  }

  unsubscribe(subscription: Subscription) {
    this.subscriptions.delete(subscription)
    if (this.isAuthenticated()) {
      const action: SocketActions = {
        action: 'unsubscribe',
        params: subscription,
      }

      this.ws?.send(JSON.stringify(action))
    }
  }

  addMessageHandler(subscription: Subscription, handler: MessageHandler) {
    if (!this.messageHandlers.has(subscription)) {
      this.messageHandlers.set(subscription, new Set())
    }
    this.messageHandlers.get(subscription)!.add(handler)
  }

  removeMessageHandler(subscription: Subscription, handler: MessageHandler) {
    this.messageHandlers.get(subscription)?.delete(handler)
    if (this.messageHandlers.get(subscription)?.size === 0) {
      this.messageHandlers.delete(subscription)
    }
  }

  addConnectionStateHandler(handler: ConnectionStateHandler) {
    this.connectionHandlers.add(handler)

    // Immediately notify of current state
    // This gives you the current state when you subscribe
    // It's nice because if you subscribe at a later point in time
    // You can immediately know whether connected or not
    handler(this.connectionState)
  }

  removeConnectionStateHandler(handler: ConnectionStateHandler) {
    this.connectionHandlers.delete(handler)
  }

  close() {
    this.ws?.close()
  }
}

// Singleton instance
export const polygonWS = new PolygonWebSocket()
