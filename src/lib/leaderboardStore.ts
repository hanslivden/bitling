// Server-side leaderboard persistence.
//
// If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (free tier at
// upstash.com, or any Redis with a REST proxy), entries survive cold starts.
// Without them this falls back to a per-instance in-memory array, which is
// fine for development but resets on every deploy/cold start.

import type { LeaderboardEntry } from './leaderboard';

const KEY = 'bitling:leaderboard:v1';
const memory: LeaderboardEntry[] = [];

function upstash(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export async function readEntries(): Promise<LeaderboardEntry[]> {
  const up = upstash();
  if (!up) return [...memory];
  try {
    const res = await fetch(`${up.url}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${up.token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const { result } = await res.json() as { result: string | null };
    return result ? JSON.parse(result) as LeaderboardEntry[] : [];
  } catch {
    return [];
  }
}

export async function writeEntries(entries: LeaderboardEntry[]): Promise<void> {
  const up = upstash();
  if (!up) {
    memory.length = 0;
    memory.push(...entries);
    return;
  }
  try {
    await fetch(`${up.url}/set/${KEY}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${up.token}` },
      body: JSON.stringify(entries),
    });
  } catch {
    // best effort — next death will retry
  }
}
