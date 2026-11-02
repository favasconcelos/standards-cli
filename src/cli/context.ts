import type { Config } from '@/config/schema';
import { loadConfig } from '@/config/store';
import { configDir, defaultCanonicalPath, stateDir, templatePath } from '@/core/paths';

export interface Context {
  home: string;
  config: Config;
  configDir: string;
  stateDir: string;
  canonical: string;
  template: string;
}

export async function createContext(home: string): Promise<Context> {
  return {
    home,
    config: await loadConfig(configDir(home)),
    configDir: configDir(home),
    stateDir: stateDir(home),
    canonical: defaultCanonicalPath(home),
    template: templatePath(),
  };
}
