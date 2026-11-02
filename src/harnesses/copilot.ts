import { spawnSync } from 'node:child_process'
import { onPath } from '@/harnesses/detect'
import type { Harness } from '@/harnesses/types'

/**
 * The real CLI reports through `copilot --version`. VS Code ships a `copilot`
 * shim on PATH that exits 0 while printing that the CLI is missing, so the
 * output has to be checked — presence on PATH alone is not enough.
 */
function copilotCliPresent(): boolean {
  if (!onPath('copilot')) return false
  try {
    const run = spawnSync('copilot', ['--version'], { timeout: 8000, encoding: 'utf8' })
    if (run.error || run.status !== 0) return false
    const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`
    return !/was not found|not installed|could not be found/i.test(output)
  } catch {
    return false
  }
}

export const copilotHarness: Harness = {
  id: 'copilot',
  label: 'Copilot',
  scope: 'repo',
  detect: () => copilotCliPresent(),
  note: 'Repo-level AGENTS.md covers the coding agent; nothing global to install.',
}
