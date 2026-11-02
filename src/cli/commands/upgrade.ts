import { execFile } from 'node:child_process'
import * as p from '@clack/prompts'
import type { Context } from '@/cli/context'
import { checkForUpdates } from '@/core/update-check'
import { StandardsError } from '@/util/errors'
import { c } from '@/util/format'
import pkg from '../../../package.json' with { type: 'json' }

function runNpmInstall(spec: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile('npm', ['install', '-g', spec], (error) => {
      if (error) reject(new StandardsError(`npm install failed: ${error.message}`))
      else resolve()
    })
    child.stdout?.pipe(process.stdout)
    child.stderr?.pipe(process.stderr)
  })
}

export async function upgradeCommand(ctx: Context, yes: boolean): Promise<void> {
  const update = await checkForUpdates({
    packageName: pkg.name,
    currentVersion: pkg.version,
    stateDir: ctx.stateDir,
    ignoreTtl: true,
  })
  if (!update) {
    console.log('Could not reach the registry. Try again when online.')
    return
  }
  if (!update.newer) {
    console.log(c.green(`Already on the latest release (${update.current}).`))
    return
  }

  console.log(`Update available: ${c.dim(update.current)} → ${c.bold(update.latest)}`)
  if (!yes) {
    const confirm = await p.confirm({ message: `Install ${pkg.name}@${update.latest} now?` })
    if (p.isCancel(confirm) || !confirm) {
      p.cancel('Upgrade cancelled.')
      return
    }
  }
  await runNpmInstall(`${pkg.name}@${update.latest}`)
  console.log(
    `\n${c.green('Upgraded.')} Run ${c.cyan('standards sync')} to apply the new standards text.`,
  )
}
