import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** True when an executable with this name is visible on PATH (no subprocess spawned). */
export function onPath(cmd: string): boolean {
  const pathEnv = process.env.PATH ?? ''
  const delimiter = process.platform === 'win32' ? ';' : ':'
  const names = process.platform === 'win32' ? [`${cmd}.exe`, `${cmd}.cmd`, cmd] : [cmd]
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue
    for (const name of names) {
      try {
        if (existsSync(join(dir, name))) return true
      } catch {
        // Unreadable PATH entries are skipped.
      }
    }
  }
  return false
}
