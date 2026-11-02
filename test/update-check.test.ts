import { describe, expect, it } from 'vitest'
import { checkForUpdates, compareVersions, UPDATE_CHECK_TTL_MS } from '@/core/update-check'
import { tempDir } from './helpers'

describe('compareVersions', () => {
  it('orders semantic versions', () => {
    expect(compareVersions('0.1.0', '0.1.0')).toBe(0)
    expect(compareVersions('0.2.0', '0.1.9')).toBe(1)
    expect(compareVersions('0.1.0', '1.0.0')).toBe(-1)
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0)
  })
})

describe('checkForUpdates', () => {
  it('returns null while the TTL has not elapsed', async () => {
    const stateDir = await tempDir()
    const first = await checkForUpdates({
      packageName: 'pkg',
      currentVersion: '0.1.0',
      stateDir,
      fetchLatest: async () => '9.9.9',
    })
    expect(first?.newer).toBe(true)
    const second = await checkForUpdates({
      packageName: 'pkg',
      currentVersion: '0.1.0',
      stateDir,
      fetchLatest: async () => {
        throw new Error('must not be called')
      },
    })
    expect(second).toBeNull()
  })

  it('reports up-to-date and unreachable registries distinctly', async () => {
    const stateDir = await tempDir()
    const same = await checkForUpdates({
      packageName: 'pkg',
      currentVersion: '1.0.0',
      stateDir,
      ignoreTtl: true,
      fetchLatest: async () => '1.0.0',
    })
    expect(same?.newer).toBe(false)
    const offline = await checkForUpdates({
      packageName: 'pkg',
      currentVersion: '1.0.0',
      stateDir,
      ignoreTtl: true,
      fetchLatest: async () => null,
    })
    expect(offline).toBeNull()
  })

  it('rechecks after the TTL expires', async () => {
    const stateDir = await tempDir()
    await checkForUpdates({
      packageName: 'pkg',
      currentVersion: '1.0.0',
      stateDir,
      now: 0,
      fetchLatest: async () => '1.0.0',
    })
    let called = false
    await checkForUpdates({
      packageName: 'pkg',
      currentVersion: '1.0.0',
      stateDir,
      now: UPDATE_CHECK_TTL_MS + 1,
      fetchLatest: async () => {
        called = true
        return '1.0.0'
      },
    })
    expect(called).toBe(true)
  })
})
