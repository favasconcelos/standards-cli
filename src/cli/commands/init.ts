import * as p from '@clack/prompts';
import type { Context } from '@/cli/context';
import { saveConfig } from '@/config/store';
import { ensureCanonical, ensureLink } from '@/core/sync';
import { globalHarnesses, harnessById } from '@/harnesses/index';
import { c } from '@/util/format';
import { tildify } from '@/util/path';

function cancelled<T>(value: T | symbol): value is symbol {
  if (p.isCancel(value)) {
    p.cancel('Setup cancelled. Nothing was changed.');
    return true;
  }
  return false;
}

export async function initCommand(ctx: Context): Promise<void> {
  p.intro(c.bold('standards setup'));

  const options = globalHarnesses().map((h) => ({
    value: h.id,
    label: `${h.label}${h.detect(ctx.home) ? '' : ' (not detected)'}`,
    hint: h.note,
  }));
  const selected = await p.multiselect({
    message: 'Which harnesses should receive the standards?',
    options,
    initialValues: globalHarnesses()
      .filter((h) => h.detect(ctx.home))
      .map((h) => h.id),
    required: false,
  });
  if (cancelled(selected)) {
    return;
  }

  const ids = selected as string[];
  const config = { ...ctx.config, harnesses: ids };
  await saveConfig(ctx.configDir, config);
  p.log.success(`Saved settings to ${tildify(ctx.configDir)}/config.json`);

  const { wrote, backup } = await ensureCanonical(ctx.template, ctx.canonical);
  p.log.success(
    wrote ? `Installed canonical copy to ${tildify(ctx.canonical)}${backup ? ` (previous backed up to ${tildify(backup)})` : ''}` : `Canonical copy is current at ${tildify(ctx.canonical)}`,
  );

  for (const id of ids) {
    const harness = harnessById(id);
    if (!harness?.pointerPath) {
      continue;
    }
    const pointer = harness.pointerPath(ctx.home);
    const result = await ensureLink(pointer, ctx.canonical);
    if (result.action === 'already') {
      p.log.success(`${harness.label}: already linked.`);
    } else {
      p.log.success(`${harness.label}: pointer installed at ${tildify(pointer)}${result.backup ? ` (previous backed up to ${tildify(result.backup)})` : ''}`);
    }
    if (harness.configWiring) {
      const wired = await harness.configWiring.ensure(ctx.home, pointer);
      p.log.success(
        wired.changed
          ? `${harness.label}: added ${harness.configWiring.label} entry in ${tildify(wired.path)}${wired.backup ? ` (previous backed up to ${tildify(wired.backup)})` : ''}`
          : `${harness.label}: ${harness.configWiring.label} already set.`,
      );
    }
  }

  p.outro(`All set. Run ${c.cyan('standards status')} to verify, ${c.cyan('standards sync')} after upgrades.`);
}
