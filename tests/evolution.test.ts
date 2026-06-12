import { describe, it, expect } from 'vitest';
import { getEvolution } from '../src/lib/creatures';

describe('getEvolution', () => {
  it('hatches eggs by lineage', () => {
    expect(getEvolution('egg', 100, 0, 'sunny')).toBe('sunnling');
    expect(getEvolution('egg', 100, 0, 'stormy')).toBe('grumbit');
    expect(getEvolution('egg', 100, 0, 'misty')).toBe('wisp');
    expect(getEvolution('egg', 100, 0, undefined)).toBe('sunnling');
  });

  it('branches sunnling on care and neglect', () => {
    expect(getEvolution('sunnling', 80, 0)).toBe('puffi');
    expect(getEvolution('sunnling', 30, 0)).toBe('grimble');
    expect(getEvolution('sunnling', 80, 10)).toBe('grimble');
  });

  it('routes wisp to the secret form', () => {
    expect(getEvolution('wisp', 100, 0)).toBe('phantom');
  });

  it('final forms do not evolve', () => {
    expect(getEvolution('lumix', 100, 0)).toBeNull();
    expect(getEvolution('gloom', 100, 0)).toBeNull();
    expect(getEvolution('phantom', 100, 0)).toBeNull();
  });
});
