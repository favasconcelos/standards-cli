import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StandardsError } from '@/util/errors';

const PACKAGE_NAME = '@favasconcelos/standards-cli';

/** Package root, found by walking up from this file (works bundled and from source). */
export function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    try {
      const raw = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
        name?: string;
      };
      if (raw.name === PACKAGE_NAME) {
        return dir;
      }
    } catch {
      // Not a package root — keep walking.
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new StandardsError('Could not locate the standards-cli package root.');
    }
    dir = parent;
  }
}

/** Standards text shipped with this release. */
export function templatePath(): string {
  return join(packageRoot(), 'templates/CODE_STANDARDS.md');
}

/** Machine-wide canonical copy every harness pointer resolves to.
 * Intentionally XDG-style (`~/.local/...`) on all platforms — including Windows and macOS —
 * so harness pointers and docs stay identical everywhere. */
export function defaultCanonicalPath(home: string = homedir()): string {
  return join(home, '.local/share/standards-cli/CODE_STANDARDS.md');
}

export function configDir(home: string = homedir()): string {
  return process.env.STANDARDS_CLI_CONFIG_DIR ?? join(home, '.config/standards-cli');
}

export function stateDir(home: string = homedir()): string {
  return process.env.STANDARDS_CLI_STATE_DIR ?? join(home, '.local/state/standards-cli');
}
