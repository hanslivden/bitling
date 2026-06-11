import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory store ──────────────────────────────────────────────────────────
// This resets on cold start.
// To persist: swap for Supabase, Vercel KV, or any DB.
//
//   Supabase example:
//     import { createClient } from '@supabase/supabase-js'
//     const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
//     async function getEntries() {
//       const { data } = await db.from('gotchi_leaderboard').select('*').order('age_hours', { ascending: false }).limit(50)
//       return data ?? []
//     }
// ─────────────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  id: string;
  petName: string;
  creatureId: string;
  ageHours: number;
  causeOfDeath: string;
  diedAt: number;
  careScore: number;
  mealsEaten: number;
  gamesPlayed: number;
}

const store: LeaderboardEntry[] = [];
const MAX_ENTRIES = 50;
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
function sanitize(body: Record<string, unknown>): LeaderboardEntry | null {
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
  };
}

export async function GET() {
  const sorted = [...store]
    .sort((a, b) => b.ageHours - a.ageHours)
    .slice(0, 20);
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const entry = sanitize(body);
    if (!entry) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Deduplicate by pet ID
    const existing = store.findIndex(e => e.id === entry.id);
    if (existing >= 0) {
      store[existing] = entry; // update if already submitted
    } else {
      store.push(entry);
    }

    // Keep store bounded
    if (store.length > MAX_ENTRIES) {
      store.sort((a, b) => b.ageHours - a.ageHours);
      store.splice(MAX_ENTRIES);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
