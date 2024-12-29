import { restClient } from '@polygon.io/client-js'

export const rest = restClient(import.meta.env.VITE_API_POLY_KEY)
