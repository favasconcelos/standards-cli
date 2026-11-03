import { homedir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { expandHome, isAbsoluteCrossPlatform, samePath, tildify } from '@/util/path';

describe('cross-platform paths', () => {
  it('treats mixed separators as the same path', () => {
    expect(samePath('C:\\Users\\bob\\.config\\x.md', 'c:/users/bob/.config/x.md')).toBe(true);
    expect(samePath('/home/bob/.config/x.md', '/home/bob/.config/y.md')).toBe(false);
  });

  it('recognises Windows absolutes from any platform', () => {
    expect(isAbsoluteCrossPlatform('C:\\Users\\bob\\x.md')).toBe(true);
    expect(isAbsoluteCrossPlatform('C:/Users/bob/x.md')).toBe(true);
    expect(isAbsoluteCrossPlatform('/home/bob/x.md')).toBe(true);
    expect(isAbsoluteCrossPlatform('relative/x.md')).toBe(false);
    expect(isAbsoluteCrossPlatform('CODE_STANDARDS.md')).toBe(false);
  });

  it('expands ~ with either slash', async () => {
    const { join } = await import('node:path');
    const home = homedir();
    expect(expandHome('~')).toBe(home);
    expect(expandHome('~/a/b.md')).toBe(join(home, 'a/b.md'));
    if (process.platform === 'win32') {
      expect(expandHome('~\\a\\b.md')).toBe(join(home, 'a/b.md'));
    }
  });

  it('tildifies the home prefix', () => {
    expect(tildify(homedir())).toBe('~');
  });
});
