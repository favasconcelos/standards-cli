import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

function isRunnable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** True when a runnable file with this name is visible on PATH (no subprocess spawned). */
export function onPath(cmd: string): boolean {
  return resolveOnPath(cmd) !== null;
}

/** Full path of `cmd` on PATH, or null. Handles Windows executable extensions and `;` delimiters. */
export function resolveOnPath(cmd: string): string | null {
  const pathEnv = process.env.PATH ?? '';
  const delimiter = process.platform === 'win32' ? ';' : ':';
  const names = process.platform === 'win32' ? [`${cmd}.exe`, `${cmd}.cmd`, `${cmd}.bat`, cmd] : [cmd];
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) {
      continue;
    }
    for (const name of names) {
      const candidate = join(dir, name);
      if (isRunnable(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

/** Pass to spawn options: `.cmd`/`.bat` shims (npm, copilot) only resolve under a shell on Windows. */
export function shellOnWindows(): boolean | undefined {
  return process.platform === 'win32' ? true : undefined;
}
