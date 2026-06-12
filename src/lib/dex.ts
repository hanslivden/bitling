// Creature dex — remembers every form the player has ever raised,
// across all pets and generations.

import type { CreatureId } from './creatures';

const KEY = 'bitling_dex_v1';

export function getDiscovered(): CreatureId[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list as CreatureId[] : [];
  } catch {
    return [];
  }
}

export function recordDiscovery(id: CreatureId): void {
  if (id === 'egg') return;
  try {
    const list = getDiscovered();
    if (list.includes(id)) return;
    list.push(id);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}
