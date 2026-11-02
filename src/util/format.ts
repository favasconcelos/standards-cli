import { styleText } from 'node:util'

export const DAY_MS = 24 * 60 * 60 * 1000

export const c = {
  bold: (s: string) => styleText('bold', s),
  dim: (s: string) => styleText('dim', s),
  red: (s: string) => styleText('red', s),
  green: (s: string) => styleText('green', s),
  yellow: (s: string) => styleText('yellow', s),
  cyan: (s: string) => styleText('cyan', s),
}
