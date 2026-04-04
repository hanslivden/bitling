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

export async function GET() {
  const sorted = [...store]
    .sort((a, b) => b.ageHours - a.ageHours)
    .slice(0, 20);
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LeaderboardEntry;

    // Basic validation
    if (!body.id || typeof body.ageHours !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Deduplicate by pet ID
    const existing = store.findIndex(e => e.id === body.id);
    if (existing >= 0) {
      store[existing] = body; // update if already submitted
    } else {
      store.push(body);
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
