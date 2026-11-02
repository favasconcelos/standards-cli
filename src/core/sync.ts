import { copyFile, lstat, mkdir, readFile, readlink, rename, symlink } from 'node:fs/promises';
import { dirname } from 'node:path';

function backupName(path: string): string {
  return `${path}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

/** Byte comparison; missing files count as different. */
export async function filesEqual(a: string, b: string): Promise<boolean> {
  try {
    const [x, y] = await Promise.all([readFile(a), readFile(b)]);
    return x.equals(y);
  } catch {
    return false;
  }
}

/**
 * Copies the template to the canonical path when content differs.
 * A hand-edited canonical copy is backed up first, never deleted.
 */
export async function ensureCanonical(template: string, canonical: string): Promise<{ wrote: boolean; backup?: string }> {
  if (await filesEqual(template, canonical)) {
    return { wrote: false };
  }
  await mkdir(dirname(canonical), { recursive: true });
  let backup: string | undefined;
  if (await exists(canonical)) {
    backup = backupName(canonical);
    await rename(canonical, backup);
  }
  await copyFile(template, canonical);
  return { wrote: true, backup };
}

export type LinkAction = 'already' | 'linked' | 'relinked';

/**
 * Creates `pointer` as a symlink to `canonical`.
 * Real files or stale symlinks found at the pointer path are backed up first, never deleted.
 */
export async function ensureLink(pointer: string, canonical: string): Promise<{ action: LinkAction; backup?: string }> {
  let missing = false;
  try {
    const st = await lstat(pointer);
    if (st.isSymbolicLink() && (await readlink(pointer)) === canonical) {
      return { action: 'already' };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    missing = true;
  }
  if (missing) {
    await mkdir(dirname(pointer), { recursive: true });
    await symlink(canonical, pointer);
    return { action: 'linked' };
  }
  const backup = backupName(pointer);
  await rename(pointer, backup);
  await symlink(canonical, pointer);
  return { action: 'relinked', backup };
}

/** Resolves the pointer path itself (never follows the link). Null when absent or not a link. */
export async function linkTarget(pointer: string): Promise<string | null> {
  try {
    if (!(await lstat(pointer)).isSymbolicLink()) {
      return null;
    }
    return await readlink(pointer);
  } catch {
    return null;
  }
}
