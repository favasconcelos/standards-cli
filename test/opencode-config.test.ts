import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'jsonc-parser';
import { describe, expect, it } from 'vitest';
import { ensureInstructionsEntry, hasInstructionsEntry } from '@/harnesses/opencode-config';
import { StandardsError } from '@/util/errors';
import { tempDir, writeFile } from './helpers';

const ENTRY = '~/.config/opencode/CODE_STANDARDS.md';

async function setup(files: Record<string, string> = {}): Promise<{ home: string; pointer: string }> {
  const home = await tempDir();
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(home, '.config/opencode', name), content);
  }
  return { home, pointer: join(home, '.config/opencode/CODE_STANDARDS.md') };
}

describe('ensureInstructionsEntry', () => {
  it('creates opencode.jsonc when no global config exists', async () => {
    const { home, pointer } = await setup();
    const result = await ensureInstructionsEntry(home, pointer);
    expect(result.action).toBe('created');
    expect(result.path).toBe(join(home, '.config/opencode/opencode.jsonc'));
    expect(parse(await readFile(result.path, 'utf8'))).toEqual({
      $schema: 'https://opencode.ai/config.json',
      instructions: [ENTRY],
    });
  });

  it('adds the instructions key to an existing config and keeps comments', async () => {
    const original = '{\n  // keep me\n  "formatter": true,\n}\n';
    const { home, pointer } = await setup({ 'opencode.jsonc': original });
    const result = await ensureInstructionsEntry(home, pointer);
    expect(result.action).toBe('added');
    const text = await readFile(result.path, 'utf8');
    expect(text).toContain('// keep me');
    expect(parse(text)).toEqual({ formatter: true, instructions: [ENTRY] });
    expect(await readFile(result.backup as string, 'utf8')).toBe(original);
  });

  it('appends to an existing instructions array without touching other entries', async () => {
    const { home, pointer } = await setup({ 'opencode.jsonc': '{\n  "instructions": ["CONTRIBUTING.md"]\n}\n' });
    const result = await ensureInstructionsEntry(home, pointer);
    expect(result.action).toBe('added');
    expect(parse(await readFile(result.path, 'utf8')).instructions).toEqual(['CONTRIBUTING.md', ENTRY]);
  });

  it('uses opencode.json when that is the existing global config', async () => {
    const { home, pointer } = await setup({ 'opencode.json': '{}\n' });
    const result = await ensureInstructionsEntry(home, pointer);
    expect(result.path).toBe(join(home, '.config/opencode/opencode.json'));
    expect(parse(await readFile(result.path, 'utf8')).instructions).toEqual([ENTRY]);
  });

  it('is idempotent and recognises ~/ and absolute spellings of the same file', async () => {
    for (const spelling of [ENTRY, null]) {
      const { home, pointer } = await setup();
      await writeFile(join(home, '.config/opencode/opencode.jsonc'), `{ "instructions": ["${spelling ?? pointer}"] }\n`);
      expect(await hasInstructionsEntry(home, pointer)).toBe(true);
      expect((await ensureInstructionsEntry(home, pointer)).action).toBe('already');
    }
  });

  it('does not treat a relative entry as the global pointer', async () => {
    const { home, pointer } = await setup({ 'opencode.jsonc': '{ "instructions": ["CODE_STANDARDS.md"] }\n' });
    expect(await hasInstructionsEntry(home, pointer)).toBe(false);
    expect((await ensureInstructionsEntry(home, pointer)).action).toBe('added');
  });

  it('reports absence when there is no config', async () => {
    const { home, pointer } = await setup();
    expect(await hasInstructionsEntry(home, pointer)).toBe(false);
  });

  it('refuses to edit an unparsable config or a non-array instructions value', async () => {
    const broken = await setup({ 'opencode.jsonc': '{ "formatter": ' });
    await expect(ensureInstructionsEntry(broken.home, broken.pointer)).rejects.toBeInstanceOf(StandardsError);
    expect(await readFile(join(broken.home, '.config/opencode/opencode.jsonc'), 'utf8')).toBe('{ "formatter": ');

    const wrongType = await setup({ 'opencode.jsonc': '{ "instructions": "x.md" }\n' });
    await expect(ensureInstructionsEntry(wrongType.home, wrongType.pointer)).rejects.toBeInstanceOf(StandardsError);
  });
});
