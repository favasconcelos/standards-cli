import { lstat, readFile, readlink, symlink, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ensureCanonical, ensureLink, filesEqual, linkTarget } from '@/core/sync'
import { tempDir, writeFile } from './helpers'

describe('ensureCanonical', () => {
  it('copies the template when missing and reports unchanged on rerun', async () => {
    const dir = await tempDir()
    const template = join(dir, 'template.md')
    const canonical = join(dir, 'nested/CODE_STANDARDS.md')
    await writeFile(template, 'hello\n')
    expect(await ensureCanonical(template, canonical)).toEqual({ wrote: true, backup: undefined })
    expect(await readFile(canonical, 'utf8')).toBe('hello\n')
    expect(await ensureCanonical(template, canonical)).toEqual({ wrote: false })
    expect(await filesEqual(template, canonical)).toBe(true)
  })

  it('backs up a hand-edited canonical copy instead of deleting it', async () => {
    const dir = await tempDir()
    const template = join(dir, 'template.md')
    const canonical = join(dir, 'CODE_STANDARDS.md')
    await writeFile(template, 'new\n')
    await writeFile(canonical, 'mine\n')
    const result = await ensureCanonical(template, canonical)
    expect(result.wrote).toBe(true)
    expect(result.backup).toBeDefined()
    expect(await readFile(result.backup as string, 'utf8')).toBe('mine\n')
    expect(await readFile(canonical, 'utf8')).toBe('new\n')
  })
})

describe('ensureLink', () => {
  it('creates, keeps, and repairs pointer symlinks', async () => {
    const dir = await tempDir()
    const canonical = join(dir, 'canonical.md')
    const pointer = join(dir, 'nested/AGENTS.md')
    await writeFile(canonical, 'x\n')

    expect(await ensureLink(pointer, canonical)).toEqual({ action: 'linked' })
    expect((await lstat(pointer)).isSymbolicLink()).toBe(true)
    expect(await linkTarget(pointer)).toBe(canonical)

    expect(await ensureLink(pointer, canonical)).toEqual({ action: 'already' })

    const other = join(dir, 'other.md')
    await writeFile(other, 'y\n')
    await unlink(pointer)
    await symlink(other, pointer)
    const repaired = await ensureLink(pointer, canonical)
    expect(repaired.action).toBe('relinked')
    expect(repaired.backup).toBeDefined()
    expect(await readlink(pointer)).toBe(canonical)
    expect(await readFile(repaired.backup as string, 'utf8')).toBe('y\n')
  })

  it('backs up a real file found at the pointer path', async () => {
    const dir = await tempDir()
    const canonical = join(dir, 'canonical.md')
    const pointer = join(dir, 'AGENTS.md')
    await writeFile(canonical, 'x\n')
    await writeFile(pointer, 'real file\n')
    const result = await ensureLink(pointer, canonical)
    expect(result.action).toBe('relinked')
    expect(await readFile(result.backup as string, 'utf8')).toBe('real file\n')
    expect(await linkTarget(pointer)).toBe(canonical)
  })

  it('returns null for missing or non-link pointers', async () => {
    const dir = await tempDir()
    expect(await linkTarget(join(dir, 'absent.md'))).toBeNull()
    const real = join(dir, 'real.md')
    await writeFile(real, 'x\n')
    expect(await linkTarget(real)).toBeNull()
  })
})
