import { readFile } from 'node:fs/promises';
import type { Context } from '@/cli/context';
import { StandardsError } from '@/util/errors';
import { c } from '@/util/format';

const MAX_PAIRS = 20;

/** Prints differing lines between the template and the installed canonical copy. */
export async function diffCommand(ctx: Context): Promise<void> {
  let template: string;
  try {
    template = await readFile(ctx.template, 'utf8');
  } catch (error) {
    throw new StandardsError(`Could not read template: ${(error as Error).message}`);
  }
  let canonical: string;
  try {
    canonical = await readFile(ctx.canonical, 'utf8');
  } catch {
    throw new StandardsError('No installed canonical copy yet. Run `standards sync` first.');
  }

  if (template === canonical) {
    console.log(c.green('Installed copy matches the template.'));
    return;
  }

  const a = template.split('\n');
  const b = canonical.split('\n');
  let shown = 0;
  for (let i = 0; i < Math.max(a.length, b.length) && shown < MAX_PAIRS; i++) {
    if (a[i] !== b[i]) {
      console.log(c.dim(`line ${i + 1}:`));
      if (a[i] !== undefined) {
        console.log(`${c.red('-')} ${a[i]}`);
      }
      if (b[i] !== undefined) {
        console.log(`${c.green('+')} ${b[i]}`);
      }
      shown++;
    }
  }
  if (shown === MAX_PAIRS) {
    console.log(c.dim(`…showing first ${MAX_PAIRS} differing lines`));
  }
}
