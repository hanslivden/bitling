import { NextRequest, NextResponse } from 'next/server';
import { sanitizeEntry, MAX_ENTRIES } from '@/lib/leaderboard';
import { readEntries, writeEntries } from '@/lib/leaderboardStore';

export async function GET() {
  const entries = await readEntries();
  const sorted = entries
    .sort((a, b) => b.ageHours - a.ageHours)
    .slice(0, 20);
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const entry = sanitizeEntry(body);
    if (!entry) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const store = await readEntries();

    // Deduplicate by pet ID
    const existing = store.findIndex(e => e.id === entry.id);
    if (existing >= 0) {
      store[existing] = entry; // update if already submitted
    } else {
      store.push(entry);
    }

    // Keep store bounded
    store.sort((a, b) => b.ageHours - a.ageHours);
    store.splice(MAX_ENTRIES);

    await writeEntries(store);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
