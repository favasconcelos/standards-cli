import { z } from 'zod'

export const configSchema = z.object({
  harnesses: z.array(z.string()).default([]),
  autoCheckUpdates: z.boolean().default(true),
  lastUpdateCheck: z.number().int().nonnegative().default(0),
})

export type Config = z.infer<typeof configSchema>
export type ConfigKey = keyof Config

export const SCALAR_KEYS = ['autoCheckUpdates'] as const satisfies readonly ConfigKey[]
