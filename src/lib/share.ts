import type { PetState } from './petState';

// Minimal snapshot for a shareable URL (encoded in query param)
type ShareSnapshot = Pick<
  PetState,
  | 'id' | 'name' | 'creatureId' | 'age' | 'hunger' | 'happiness'
  | 'careScore' | 'dead' | 'bornAt' | 'mealsEaten' | 'gamesPlayed'
  | 'weight' | 'causeOfDeath' | 'diedAt' | 'neglectCount'
>;

// btoa/atob only handle Latin-1, so round-trip through UTF-8 bytes to
// support pet names with arbitrary characters. Decoding stays compatible
// with previously shared ASCII-only links.
function toBase64(text: string): string {
  let bin = '';
  for (const byte of new TextEncoder().encode(text)) {
    bin += String.fromCharCode(byte);
  }
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePetForShare(pet: PetState): string {
  const snap: ShareSnapshot = {
    id: pet.id,
    name: pet.name,
    creatureId: pet.creatureId,
    age: pet.age,
    hunger: pet.hunger,
    happiness: pet.happiness,
    careScore: pet.careScore,
    dead: pet.dead,
    bornAt: pet.bornAt,
    mealsEaten: pet.mealsEaten,
    gamesPlayed: pet.gamesPlayed,
    weight: pet.weight,
    causeOfDeath: pet.causeOfDeath,
    diedAt: pet.diedAt,
    neglectCount: pet.neglectCount,
  };
  return toBase64(JSON.stringify(snap));
}

export function decodePetFromShare(encoded: string): Partial<PetState> | null {
  try {
    return JSON.parse(fromBase64(encoded)) as Partial<PetState>;
  } catch {
    return null;
  }
}

export function buildBookmarkUrl(petId: string): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  u.searchParams.set('pet', petId);
  u.searchParams.delete('view');
  return u.toString();
}

export function buildShareUrl(pet: PetState): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.origin + window.location.pathname);
  u.searchParams.set('view', encodePetForShare(pet));
  return u.toString();
}
