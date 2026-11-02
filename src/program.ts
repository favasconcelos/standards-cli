import { homedir } from 'node:os'
import { Command } from 'commander'
import { configGetCommand, configSetCommand } from '@/cli/commands/config'
import { diffCommand } from '@/cli/commands/diff'
import { initCommand } from '@/cli/commands/init'
import { statusCommand } from '@/cli/commands/status'
import { syncCommand } from '@/cli/commands/sync'
import { upgradeCommand } from '@/cli/commands/upgrade'
import { createContext } from '@/cli/context'
import { StandardsError } from '@/util/errors'
import { c } from '@/util/format'
import pkg from '../package.json' with { type: 'json' }

/** Builds the command tree without running it, so it can also be inspected (tests). */
export function buildProgram(): Command {
  const program = new Command()
  program
    .name('standards')
    .description('Install shared coding standards and wire them into every AI harness.')
    .version(pkg.version)

  /** Wraps an action so expected failures print a clean message instead of a stack trace. */
  function action<A extends unknown[]>(fn: (...args: A) => Promise<void> | void) {
    return async (...args: A) => {
      try {
        await fn(...args)
      } catch (error) {
        if (error instanceof StandardsError) {
          console.error(`${c.red('error:')} ${error.message}`)
        } else {
          console.error(error)
        }
        process.exitCode = 1
      }
    }
  }

  const context = () => createContext(homedir())

  program
    .command('init')
    .description('interactive setup: pick harnesses, install pointers')
    .action(action(async () => initCommand(await context())))

  program
    .command('sync')
    .description('refresh the canonical copy and repair harness pointers')
    .action(action(async () => syncCommand(await context())))

  program
    .command('status')
    .description('show harness, pointer, and update state')
    .action(action(async () => statusCommand(await context())))

  program
    .command('diff')
    .description('show template vs installed canonical differences')
    .action(action(async () => diffCommand(await context())))

  program
    .command('upgrade')
    .description('install the latest release, then re-sync')
    .option('-y, --yes', 'do not ask for confirmation')
    .action(
      action(async (options: { yes?: boolean }) =>
        upgradeCommand(await context(), options.yes === true),
      ),
    )

  const config = program.command('config').description('view or change settings')
  config
    .command('get [key]')
    .description('print one setting or all')
    .action(action(async (key?: string) => configGetCommand(await context(), key)))
  config
    .command('set <key> <value>')
    .description('change a setting')
    .action(
      action(async (key: string, value: string) => configSetCommand(await context(), key, value)),
    )

  return program
}
