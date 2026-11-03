import { join } from 'node:path';
import { onPath } from '@/harnesses/detect';
import { ensureInstructionsEntry, hasInstructionsEntry } from '@/harnesses/opencode-config';
import type { Harness } from '@/harnesses/types';

export const opencodeHarness: Harness = {
  id: 'opencode',
  label: 'OpenCode',
  scope: 'global',
  pointerPath: (home) => join(home, '.config/opencode/CODE_STANDARDS.md'),
  configWiring: {
    label: 'opencode.json(c) instructions',
    check: hasInstructionsEntry,
    ensure: async (home, pointer) => {
      const { action, path, backup } = await ensureInstructionsEntry(home, pointer);
      return { changed: action !== 'already', path, backup };
    },
  },
  detect: () => onPath('opencode'),
  note: 'Symlink plus an `instructions` entry in the global opencode config (OpenCode only auto-loads AGENTS.md).',
};
