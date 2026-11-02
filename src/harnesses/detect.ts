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
  const pathEnv = process.env.PATH ?? '';
  const delimiter = process.platform === 'win32' ? ';' : ':';
  const names = process.platform === 'win32' ? [`${cmd}.exe`, `${cmd}.cmd`, `${cmd}.bat`, cmd] : [cmd];
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) {
      continue;
    }
    for (const name of names) {
      if (isRunnable(join(dir, name))) {
        return true;
      }
    }
  }
  return false;
}
