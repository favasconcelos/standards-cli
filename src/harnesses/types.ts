export type HarnessScope = 'global' | 'repo';

/** Extra step for harnesses that do not read the pointer file on their own and need a config entry. */
export interface HarnessConfigWiring {
  /** Short name of the config entry, used in status output. */
  label: string;
  /** True when the harness config already references the pointer file. */
  check: (home: string, pointer: string) => Promise<boolean>;
  /** Adds the missing config entry; idempotent. */
  ensure: (home: string, pointer: string) => Promise<{ changed: boolean; path: string; backup?: string }>;
}

export interface Harness {
  id: string;
  label: string;
  scope: HarnessScope;
  /** File the harness reads. Absent for repo-scoped harnesses (nothing global to install). */
  pointerPath?: (home: string) => string;
  /** Config entry that makes the harness read the pointer file. Absent when the pointer alone is enough. */
  configWiring?: HarnessConfigWiring;
  /** True when the harness looks installed (a runnable binary on PATH). */
  detect: (home: string) => boolean;
  /** One-line note shown in the wizard and status output. */
  note: string;
}
