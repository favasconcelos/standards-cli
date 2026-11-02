import { readFile } from 'node:fs/promises'
import type { Context } from '@/cli/context'
import { filesEqual, linkTarget } from '@/core/sync'
import { checkForUpdates } from '@/core/update-check'
import { HARNESSES } from '@/harnesses/index'
import { c } from '@/util/format'
import { tildify } from '@/util/path'
import pkg from '../../../package.json' with { type: 'json' }

export async function statusCommand(ctx: Context): Promise<void> {
  console.log(
    `${c.bold('standards')} ${pkg.version} ${c.dim(`(canonical: ${tildify(ctx.canonical)})`)}`,
  )

  const inSync = await filesEqual(ctx.template, ctx.canonical)
  let canonicalNote: string
  try {
    await readFile(ctx.canonical, 'utf8')
    canonicalNote = inSync
      ? c.green('in sync with template')
      : c.yellow('differs from template (run standards diff)')
  } catch {
    canonicalNote = c.red('missing (run standards sync)')
  }
  console.log(`canonical: ${canonicalNote}`)

  for (const harness of HARNESSES) {
    const detected = harness.detect(ctx.home) ? c.green('detected') : c.dim('not detected')
    const configured = ctx.config.harnesses.includes(harness.id)
      ? c.green('wired')
      : c.dim('not wired')
    let pointer = c.dim('—')
    if (harness.pointerPath) {
      const path = harness.pointerPath(ctx.home)
      const target = await linkTarget(path)
      pointer =
        target === ctx.canonical
          ? c.green(`linked → ${tildify(ctx.canonical)}`)
          : target
            ? c.yellow(`points elsewhere → ${tildify(target)}`)
            : c.red('missing pointer')
    }
    console.log(
      `${c.bold(harness.label)} ${c.dim(`[${harness.id}]`)}: ${detected}, ${configured}, ${pointer}`,
    )
  }

  if (ctx.config.autoCheckUpdates) {
    const update = await checkForUpdates({
      packageName: pkg.name,
      currentVersion: pkg.version,
      stateDir: ctx.stateDir,
    })
    if (update?.newer) {
      console.log(
        `\n${c.yellow('update available:')} ${update.current} → ${update.latest}. Run ${c.cyan('standards upgrade')}.`,
      )
    }
  }
}
