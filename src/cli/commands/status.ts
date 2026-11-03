import { readFile } from 'node:fs/promises';
import type { Context } from '@/cli/context';
import { filesEqual, linkTarget } from '@/core/sync';
import { checkForUpdates } from '@/core/update-check';
import { HARNESSES } from '@/harnesses/index';
import { c } from '@/util/format';
import { samePath, tildify } from '@/util/path';
import pkg from '../../../package.json' with { type: 'json' };

export async function statusCommand(ctx: Context): Promise<void> {
  console.log(`${c.bold('standards')} ${pkg.version} ${c.dim(`(canonical: ${tildify(ctx.canonical)})`)}`);

  const inSync = await filesEqual(ctx.template, ctx.canonical);
  let canonicalNote: string;
  try {
    await readFile(ctx.canonical, 'utf8');
    canonicalNote = inSync ? c.green('in sync with template') : c.yellow('differs from template (run standards diff)');
  } catch {
    canonicalNote = c.red('missing (run standards sync)');
  }
  console.log(`canonical: ${canonicalNote}`);

  for (const harness of HARNESSES) {
    const detected = harness.detect(ctx.home) ? c.green('detected') : c.dim('not detected');
    const configured = ctx.config.harnesses.includes(harness.id) ? c.green('wired') : c.dim('not wired');
    let pointer = c.dim('—');
    let wiring = '';
    if (harness.pointerPath) {
      const path = harness.pointerPath(ctx.home);
      const target = await linkTarget(path);
      pointer = target === null ? c.red('missing pointer') : samePath(target, ctx.canonical) ? c.green(`linked → ${tildify(ctx.canonical)}`) : c.yellow(`points elsewhere → ${tildify(target)}`);
      if (harness.configWiring) {
        const label = harness.configWiring.label;
        try {
          wiring = `, ${(await harness.configWiring.check(ctx.home, path)) ? c.green(`${label} set`) : c.red(`${label} missing (run standards sync)`)}`;
        } catch (error) {
          wiring = `, ${c.red((error as Error).message)}`;
        }
      }
    }
    console.log(`${c.bold(harness.label)} ${c.dim(`[${harness.id}]`)}: ${detected}, ${configured}, ${pointer}${wiring}`);
  }

  if (ctx.config.autoCheckUpdates) {
    const update = await checkForUpdates({
      packageName: pkg.name,
      currentVersion: pkg.version,
      stateDir: ctx.stateDir,
    });
    if (update?.newer) {
      console.log(`\n${c.yellow('update available:')} ${update.current} → ${update.latest}. Run ${c.cyan('standards upgrade')}.`);
    }
  }
}
