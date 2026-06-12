import { describe, it, expect } from 'vitest';
import { sanitizeEntry } from '../src/lib/leaderboard';

describe('sanitizeEntry', () => {
  it('rejects payloads without id or numeric age', () => {
    expect(sanitizeEntry({})).toBeNull();
    expect(sanitizeEntry({ id: 'X' })).toBeNull();
    expect(sanitizeEntry({ id: '', ageHours: 5 })).toBeNull();
    expect(sanitizeEntry({ id: 'X', ageHours: '5' })).toBeNull();
  });

  it('clamps strings and numbers from hostile input', () => {
    const e = sanitizeEntry({
      id: 'A'.repeat(500),
      petName: 'N'.repeat(500),
      creatureId: 'C'.repeat(500),
      ageHours: 99_999_999,
      causeOfDeath: 'D'.repeat(500),
      diedAt: Number.MAX_SAFE_INTEGER,
      careScore: 100_000,
      mealsEaten: -5,
      gamesPlayed: Infinity,
      generation: -1,
      injected: 'evil',
    });
    expect(e).not.toBeNull();
    expect(e!.id.length).toBe(16);
    expect(e!.petName.length).toBe(20);
    expect(e!.ageHours).toBe(24 * 365);
    expect(e!.careScore).toBe(100);
    expect(e!.mealsEaten).toBe(0);
    expect(e!.gamesPlayed).toBe(0);
    expect(e!.generation).toBe(1);
    expect('injected' in e!).toBe(false);
  });

  it('fills fallbacks for missing optional fields', () => {
    const e = sanitizeEntry({ id: 'ABC123', ageHours: 12 });
    expect(e!.petName).toBe('UNNAMED');
    expect(e!.creatureId).toBe('unknown');
    expect(e!.causeOfDeath).toBe('unknown');
    expect(e!.generation).toBe(1);
  });
});
