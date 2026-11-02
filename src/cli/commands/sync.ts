import type { Context } from '@/cli/context'
import { ensureCanonical, ensureLink } from '@/core/sync'
import { checkForUpdates } from '@/core/update-check'
import { harnessById } from '@/harnesses/index'
import { c } from '@/util/format'
import { tildify } from '@/util/path'
import pkg from '../../../package.json' with { type: 'json' }

export async function syncCommand(ctx: Context): Promise<void> {
  if (ctx.config.harnesses.length === 0) {
    console.log(`No harnesses configured yet. Run ${c.cyan('standards init')} first.`)
    return
  }

  const { wrote, backup } = await ensureCanonical(ctx.template, ctx.canonical)
  console.log(
    wrote
      ? `${c.green('updated')} canonical copy at ${tildify(ctx.canonical)}${backup ? ` ${c.dim(`(backup: ${tildify(backup)})`)}` : ''}`
      : `${c.dim('current')} canonical copy at ${tildify(ctx.canonical)}`,
  )

  for (const id of ctx.config.harnesses) {
    const harness = harnessById(id)
    if (!harness?.pointerPath) {
      console.log(`${c.yellow('skip')} ${id}: no global pointer (repo-scoped harness).`)
      continue
    }
    const pointer = harness.pointerPath(ctx.home)
    const result = await ensureLink(pointer, ctx.canonical)
    if (result.action === 'already') {
      console.log(`${c.dim('linked')} ${harness.label} ${c.dim(tildify(pointer))}`)
    } else {
      console.log(
        `${c.green('linked')} ${harness.label} ${c.dim(tildify(pointer))}${result.backup ? ` ${c.dim(`(backup: ${tildify(result.backup)})`)}` : ''}`,
      )
    }
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
