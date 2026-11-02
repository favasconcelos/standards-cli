import type { Context } from '@/cli/context';
import { applyScalar, configFilePath, loadConfig, saveConfig } from '@/config/store';
import { StandardsError } from '@/util/errors';

export async function configGetCommand(ctx: Context, key?: string): Promise<void> {
  const config = await loadConfig(ctx.configDir);
  if (!key) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }
  if (!(key in config)) {
    throw new StandardsError(`Unknown setting "${key}".`);
  }
  console.log(JSON.stringify(config[key as keyof typeof config]));
}

export async function configSetCommand(ctx: Context, key: string, value: string): Promise<void> {
  const config = await loadConfig(ctx.configDir);
  await saveConfig(ctx.configDir, applyScalar(config, key, value));
  console.log(`Set ${key}. (${configFilePath(ctx.configDir)})`);
}
