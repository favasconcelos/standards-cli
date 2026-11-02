export type HarnessScope = 'global' | 'repo'

export interface Harness {
  id: string
  label: string
  scope: HarnessScope
  /** File the harness reads. Absent for repo-scoped harnesses (nothing global to install). */
  pointerPath?: (home: string) => string
  /** True when the harness looks installed (a runnable binary on PATH). */
  detect: (home: string) => boolean
  /** One-line note shown in the wizard and status output. */
  note: string
}
