import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { onPath } from '@/harnesses/detect'
import type { Harness } from '@/harnesses/types'

export const opencodeHarness: Harness = {
  id: 'opencode',
  label: 'OpenCode',
  scope: 'global',
  pointerPath: (home) => join(home, '.config/opencode/CODE_STANDARDS.md'),
  detect: (home) => onPath('opencode') || existsSync(join(home, '.config/opencode')),
  note: 'Already listed in opencode.json instructions; the CLI only ensures the file exists.',
}
