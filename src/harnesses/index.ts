import { claudeHarness } from '@/harnesses/claude'
import { codexHarness } from '@/harnesses/codex'
import { copilotHarness } from '@/harnesses/copilot'
import { opencodeHarness } from '@/harnesses/opencode'
import { piHarness } from '@/harnesses/pi'
import type { Harness } from '@/harnesses/types'

export const HARNESSES: Harness[] = [
  opencodeHarness,
  piHarness,
  codexHarness,
  claudeHarness,
  copilotHarness,
]

export function harnessById(id: string): Harness | undefined {
  return HARNESSES.find((h) => h.id === id)
}

export function globalHarnesses(): Harness[] {
  return HARNESSES.filter((h) => h.scope === 'global')
}
