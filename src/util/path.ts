import { homedir } from 'node:os';
import { isAbsolute, join, sep } from 'node:path';

export function expandHome(p: string): string {
  if (p === '~') {
    return homedir();
  }
  if (p.startsWith('~/') || p.startsWith('~\\')) {
    return join(homedir(), p.slice(2));
  }
  return p;
}

export function tildify(p: string): string {
  const home = homedir();
  if (samePath(p, home)) {
    return '~';
  }
  if (normalizeForCompare(p).startsWith(`${normalizeForCompare(home)}/`)) {
    return `~${p.slice(home.length)}`;
  }
  if (p === home) {
    return '~';
  }
  if (p.startsWith(home + sep)) {
    return `~${p.slice(home.length)}`;
  }
  return p;
}

/** Slash-normalized form for comparisons. Lowercased on Windows (or for Windows-looking paths). */
export function normalizeForCompare(p: string): string {
  let out = p.replace(/[\\/]+/g, '/');
  if (out.length > 1 && out.endsWith('/')) {
    out = out.slice(0, -1);
  }
  if (process.platform === 'win32' || isWindowsLike(p)) {
    out = out.toLowerCase();
  }
  return out;
}

function isWindowsLike(p: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(p) || p.includes('\\');
}

/** True when two paths name the same file across separator and (on Windows) case differences. */
export function samePath(a: string, b: string): boolean {
  return normalizeForCompare(a) === normalizeForCompare(b);
}

/** Absolute on any platform, so Windows paths also resolve when tested from POSIX. */
export function isAbsoluteCrossPlatform(p: string): boolean {
  if (isAbsolute(p)) {
    return true;
  }
  return /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\');
}
