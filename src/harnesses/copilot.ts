import type { Harness } from '@/harnesses/types'

export const copilotHarness: Harness = {
  id: 'copilot',
  label: 'Copilot',
  scope: 'repo',
  detect: () => true,
  note: 'Repo-level AGENTS.md covers the coding agent; nothing global to install.',
}
