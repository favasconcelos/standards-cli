import { join } from 'node:path';
import { onPath } from '@/harnesses/detect';
import type { Harness } from '@/harnesses/types';

export const codexHarness: Harness = {
  id: 'codex',
  label: 'Codex',
  scope: 'global',
  pointerPath: (home) => join(home, '.codex/AGENTS.md'),
  detect: () => onPath('codex'),
  note: 'Global scope; combined instructions are capped (32 KiB by default).',
};
