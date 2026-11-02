import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { globalHarnesses, HARNESSES, harnessById } from '@/harnesses/index'
import { tempDir } from './helpers'

describe('harness registry', () => {
  it('has unique ids and at least one global harness', () => {
    const ids = HARNESSES.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(globalHarnesses().length).toBeGreaterThan(0)
    expect(harnessById('opencode')?.label).toBe('OpenCode')
    expect(harnessById('nope')).toBeUndefined()
    expect(harnessById('copilot')?.scope).toBe('repo')
    expect(harnessById('copilot')?.pointerPath).toBeUndefined()
  })

  it('resolves pointer paths under the given home', async () => {
    const home = await tempDir()
    expect(harnessById('pi')?.pointerPath?.(home)).toBe(join(home, '.pi/agent/AGENTS.md'))
    expect(harnessById('codex')?.pointerPath?.(home)).toBe(join(home, '.codex/AGENTS.md'))
    expect(harnessById('claude')?.pointerPath?.(home)).toBe(join(home, '.claude/CLAUDE.md'))
    expect(harnessById('opencode')?.pointerPath?.(home)).toBe(
      join(home, '.config/opencode/CODE_STANDARDS.md'),
    )
  })

  it('detect does not throw on an empty home', async () => {
    const home = await tempDir()
    for (const harness of HARNESSES) {
      expect(() => harness.detect(home)).not.toThrow()
    }
  })
})
