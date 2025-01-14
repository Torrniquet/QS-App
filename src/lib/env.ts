import { z } from 'zod'

const envSchema = z.object({
  VITE_API_POLY_KEY: z.string(),
})

export const env = envSchema.parse(import.meta.env)
