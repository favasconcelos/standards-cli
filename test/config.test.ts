import { describe, expect, it } from 'vitest';
import { configSchema } from '@/config/schema';
import { applyScalar, loadConfig, saveConfig } from '@/config/store';
import { tempDir } from './helpers';

describe('config store', () => {
  it('round-trips through the config dir', async () => {
    const dir = await tempDir();
    expect(await loadConfig(dir)).toEqual(configSchema.parse({}));
    await saveConfig(dir, configSchema.parse({ harnesses: ['pi'], autoCheckUpdates: false }));
    expect(await loadConfig(dir)).toEqual(configSchema.parse({ harnesses: ['pi'], autoCheckUpdates: false }));
  });

  it('applies scalar values with type coercion and rejects the rest', async () => {
    const base = configSchema.parse({});
    expect(applyScalar(base, 'autoCheckUpdates', 'false').autoCheckUpdates).toBe(false);
    expect(() => applyScalar(base, 'autoCheckUpdates', 'maybe')).toThrow();
    expect(() => applyScalar(base, 'harnesses', 'pi')).toThrow();
    expect(() => applyScalar(base, 'lastUpdateCheck', '1')).toThrow();
    expect(() => applyScalar(base, 'nope', '1')).toThrow();
  });
});
