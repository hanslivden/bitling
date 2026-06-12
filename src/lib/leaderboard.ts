// Shared leaderboard types + input sanitizing (used by the API route and tests).

export interface LeaderboardEntry {
  id: string;
  petName: string;
  creatureId: string;
  ageHours: number;
  causeOfDeath: string;
  diedAt: number;
  careScore: number;
  mealsEaten: number;
  gamesPlayed: number;
  generation: number;
}

export const MAX_ENTRIES = 50;
const MAX_AGE_HOURS = 24 * 365; // anything older than a year is bogus

function str(v: unknown, maxLen: number, fallback = ''): string {
  return typeof v === 'string' ? v.slice(0, maxLen) : fallback;
}

function num(v: unknown, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.floor(v)));
}

// Build a clean entry from an untrusted request body, dropping unknown
// fields and capping sizes so the store can't be flooded with junk.
export function sanitizeEntry(body: Record<string, unknown>): LeaderboardEntry | null {
  const id = str(body.id, 16);
  if (!id || typeof body.ageHours !== 'number') return null;
  return {
    id,
    petName: str(body.petName, 20, 'UNNAMED'),
    creatureId: str(body.creatureId, 20, 'unknown'),
    ageHours: num(body.ageHours, 0, MAX_AGE_HOURS),
    causeOfDeath: str(body.causeOfDeath, 24, 'unknown'),
    diedAt: num(body.diedAt, 0, Date.now()),
    careScore: num(body.careScore, 0, 100),
    mealsEaten: num(body.mealsEaten, 0, 100_000),
    gamesPlayed: num(body.gamesPlayed, 0, 100_000),
    generation: num(body.generation, 1, 1000),
  };
}
