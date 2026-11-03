import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { onPath, shellOnWindows } from '@/harnesses/detect';
import type { Harness } from '@/harnesses/types';

/**
 * The real CLI reports through `copilot --version`. VS Code ships a `copilot`
 * shim on PATH that exits 0 while printing that the CLI is missing, so the
 * output has to be checked — presence on PATH alone is not enough.
 */
function copilotCliPresent(): boolean {
  if (!onPath('copilot')) {
    return false;
  }
  try {
    const run = spawnSync('copilot', ['--version'], { timeout: 8000, encoding: 'utf8', shell: shellOnWindows() });
    if (run.error || run.status !== 0) {
      return false;
    }
    const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`;
    return !/was not found|not installed|could not be found/i.test(output);
  } catch {
    return false;
  }
}

export const copilotHarness: Harness = {
  id: 'copilot',
  label: 'Copilot',
  scope: 'global',
  pointerPath: (home) => join(home, '.copilot/copilot-instructions.md'),
  detect: () => copilotCliPresent(),
  note: 'Copilot CLI user-level instructions, applied across repositories.',
};
