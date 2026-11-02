import { join } from 'node:path'
import { onPath } from '@/harnesses/detect'
import type { Harness } from '@/harnesses/types'

export const piHarness: Harness = {
  id: 'pi',
  label: 'pi',
  scope: 'global',
  pointerPath: (home) => join(home, '.pi/agent/AGENTS.md'),
  detect: () => onPath('pi'),
  note: 'Concatenated with repo AGENTS.md files at startup.',
}
