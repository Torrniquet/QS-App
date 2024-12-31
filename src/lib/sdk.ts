import { restClient, websocketClient } from '@polygon.io/client-js'
import { env } from './env'

export const rest = restClient(env.VITE_API_POLY_KEY)
export const wsClient = websocketClient(env.VITE_API_POLY_KEY)
