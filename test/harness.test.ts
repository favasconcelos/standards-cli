import { chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { onPath } from '@/harnesses/detect';
import { globalHarnesses, HARNESSES, harnessById } from '@/harnesses/index';
import { tempDir, writeFile } from './helpers';

describe('harness registry', () => {
  it('has unique ids and at least one global harness', () => {
    const ids = HARNESSES.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(globalHarnesses().length).toBeGreaterThan(0);
    expect(harnessById('opencode')?.label).toBe('OpenCode');
    expect(harnessById('nope')).toBeUndefined();
    expect(harnessById('copilot')?.scope).toBe('global');
    expect(harnessById('opencode')?.configWiring).toBeDefined();
    expect(harnessById('pi')?.configWiring).toBeUndefined();
  });

  it('resolves pointer paths under the given home', async () => {
    const home = await tempDir();
    expect(harnessById('pi')?.pointerPath?.(home)).toBe(join(home, '.pi/agent/AGENTS.md'));
    expect(harnessById('codex')?.pointerPath?.(home)).toBe(join(home, '.codex/AGENTS.md'));
    expect(harnessById('claude')?.pointerPath?.(home)).toBe(join(home, '.claude/CLAUDE.md'));
    expect(harnessById('copilot')?.pointerPath?.(home)).toBe(join(home, '.copilot/copilot-instructions.md'));
    expect(harnessById('opencode')?.pointerPath?.(home)).toBe(join(home, '.config/opencode/CODE_STANDARDS.md'));
  });

  it('detect does not throw on an empty home', async () => {
    const home = await tempDir();
    for (const harness of HARNESSES) {
      expect(() => harness.detect(home)).not.toThrow();
    }
  });

  it('onPath requires a runnable file', async () => {
    const dir = await tempDir();
    const previousPath = process.env.PATH;
    process.env.PATH = dir;
    try {
      const name = `standards-cli-probe-${process.pid}`;
      await writeFile(join(dir, name), '#!/bin/sh\necho hi\n');
      expect(onPath(name)).toBe(false);
      await chmod(join(dir, name), 0o755);
      expect(onPath(name)).toBe(true);
    } finally {
      process.env.PATH = previousPath;
    }
  });

  it('copilot is not detected when no runnable copilot binary is on PATH', async () => {
    const home = await tempDir();
    const previousPath = process.env.PATH;
    process.env.PATH = home;
    try {
      expect(harnessById('copilot')?.detect(home)).toBe(false);
    } finally {
      process.env.PATH = previousPath;
    }
  });
});
