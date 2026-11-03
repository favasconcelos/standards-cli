import { copyFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { applyEdits, modify, type ParseError, parse } from 'jsonc-parser';
import { backupName } from '@/core/sync';
import { StandardsError } from '@/util/errors';
import { isAbsoluteCrossPlatform, normalizeForCompare, samePath } from '@/util/path';

export type InstructionsAction = 'already' | 'added' | 'created';

const SCHEMA_URL = 'https://opencode.ai/config.json';
const FORMATTING = { insertSpaces: true, tabSize: 2 };

/** Global OpenCode config: an existing `.jsonc`, then `.json`, else the `.jsonc` to create. */
async function globalConfigPath(home: string): Promise<{ path: string; exists: boolean }> {
  const dir = join(home, '.config/opencode');
  for (const name of ['opencode.jsonc', 'opencode.json']) {
    try {
      await lstat(join(dir, name));
      return { path: join(dir, name), exists: true };
    } catch {
      // Not present — try the next candidate.
    }
  }
  return { path: join(dir, 'opencode.jsonc'), exists: false };
}

/** The form written to config: `~/…` with forward slashes under home, absolute otherwise. */
function configEntry(home: string, file: string): string {
  if (samePath(file, home)) {
    return '~';
  }
  if (normalizeForCompare(file).startsWith(`${normalizeForCompare(home)}/`)) {
    const rel = file
      .slice(home.length)
      .replace(/^[\\/]+/, '')
      .replace(/\\/g, '/');
    return `~/${rel}`;
  }
  return file;
}

/** True when an `instructions` entry resolves to `file`. Relative entries are workspace-scoped, so never match. */
function entryPointsTo(entry: unknown, home: string, file: string): boolean {
  if (typeof entry !== 'string') {
    return false;
  }
  let resolved: string;
  if (entry === '~') {
    resolved = home;
  } else if (entry.startsWith('~/') || entry.startsWith('~\\')) {
    resolved = join(home, entry.slice(2));
  } else {
    resolved = entry;
  }
  return isAbsoluteCrossPlatform(resolved) && samePath(resolved, file);
}

function parseConfig(path: string, text: string): Record<string, unknown> {
  const errors: ParseError[] = [];
  const value: unknown = parse(text, errors, { allowTrailingComma: true });
  if (errors.length > 0 || typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new StandardsError(`Could not parse ${path}; fix it or add the instructions entry by hand.`);
  }
  return value as Record<string, unknown>;
}

/** The `instructions` array, or undefined when the key is absent. */
function readInstructions(path: string, config: Record<string, unknown>): unknown[] | undefined {
  const { instructions } = config;
  if (instructions !== undefined && !Array.isArray(instructions)) {
    throw new StandardsError(`"instructions" in ${path} is not an array; fix it or add the entry by hand.`);
  }
  return instructions;
}

/** True when the global OpenCode config already lists `file` under `instructions`. */
export async function hasInstructionsEntry(home: string, file: string): Promise<boolean> {
  const { path, exists } = await globalConfigPath(home);
  if (!exists) {
    return false;
  }
  const config = parseConfig(path, await readFile(path, 'utf8'));
  return (readInstructions(path, config) ?? []).some((entry) => entryPointsTo(entry, home, file));
}

/**
 * Appends `file` to `instructions` in the global OpenCode config, creating the config when missing.
 * Edits are minimal (comments and formatting are preserved) and the previous file is backed up first.
 */
export async function ensureInstructionsEntry(home: string, file: string): Promise<{ action: InstructionsAction; path: string; backup?: string }> {
  const { path, exists } = await globalConfigPath(home);
  const entry = configEntry(home, file);

  if (!exists) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify({ $schema: SCHEMA_URL, instructions: [entry] }, null, 2)}\n`, { flag: 'wx' });
    return { action: 'created', path };
  }

  const text = await readFile(path, 'utf8');
  const instructions = readInstructions(path, parseConfig(path, text));
  if (instructions?.some((item) => entryPointsTo(item, home, file))) {
    return { action: 'already', path };
  }

  const edits = instructions
    ? modify(text, ['instructions', instructions.length], entry, { formattingOptions: FORMATTING, isArrayInsertion: true })
    : modify(text, ['instructions'], [entry], { formattingOptions: FORMATTING });
  const backup = backupName(path);
  await copyFile(path, backup);
  await writeFile(path, applyEdits(text, edits));
  return { action: 'added', path, backup };
}
