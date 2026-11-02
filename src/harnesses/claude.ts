import { join } from 'node:path';
import { onPath } from '@/harnesses/detect';
import type { Harness } from '@/harnesses/types';

export const claudeHarness: Harness = {
  id: 'claude',
  label: 'Claude Code',
  scope: 'global',
  pointerPath: (home) => join(home, '.claude/CLAUDE.md'),
  detect: () => onPath('claude'),
  note: 'Symlinked under the harness-expected filename.',
};
