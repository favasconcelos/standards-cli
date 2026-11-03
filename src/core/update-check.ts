import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { shellOnWindows } from '@/harnesses/detect';
import { DAY_MS } from '@/util/format';

export const UPDATE_CHECK_TTL_MS = DAY_MS;

export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }
  return 0;
}

function latestFromNpm(packageName: string, timeoutMs = 10_000): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('npm', ['view', packageName, 'version'], { timeout: timeoutMs, shell: shellOnWindows() }, (error, stdout) => {
      if (error) {
        return resolve(null);
      }
      resolve(stdout.trim() || null);
    });
  });
}

export interface UpdateInfo {
  latest: string;
  current: string;
  newer: boolean;
}

interface CheckOptions {
  packageName: string;
  currentVersion: string;
  stateDir: string;
  now?: number;
  ignoreTtl?: boolean;
  fetchLatest?: () => Promise<string | null>;
}

/**
 * Reports a newer published release, at most once per TTL. Silent (null) on
 * failure, when offline, or when the TTL has not elapsed. Never throws.
 */
export async function checkForUpdates(options: CheckOptions): Promise<UpdateInfo | null> {
  const now = options.now ?? Date.now();
  const marker = join(options.stateDir, 'last-update-check');
  if (!options.ignoreTtl) {
    try {
      if (now - Number(await readFile(marker, 'utf8')) < UPDATE_CHECK_TTL_MS) {
        return null;
      }
    } catch {
      // No marker yet — check now.
    }
  }
  let latest: string | null = null;
  try {
    latest = await (options.fetchLatest ?? (() => latestFromNpm(options.packageName)))();
  } catch {
    latest = null;
  }
  await mkdir(options.stateDir, { recursive: true });
  await writeFile(marker, String(now));
  if (!latest) {
    return null;
  }
  return {
    latest,
    current: options.currentVersion,
    newer: compareVersions(latest, options.currentVersion) > 0,
  };
}
