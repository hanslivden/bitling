import { describe, it, expect } from 'vitest';
import { encodePetForShare, decodePetFromShare } from '../src/lib/share';
import { createNewPet } from '../src/lib/petState';

describe('share encoding', () => {
  it('round-trips a plain pet', () => {
    const pet = createNewPet('BLOBBY');
    const decoded = decodePetFromShare(encodePetForShare(pet));
    expect(decoded?.id).toBe(pet.id);
    expect(decoded?.name).toBe('BLOBBY');
    expect(decoded?.generation).toBe(1);
  });

  it('round-trips names outside Latin-1 (emoji, accents)', () => {
    const pet = createNewPet('ÆØN🐣');
    const decoded = decodePetFromShare(encodePetForShare(pet));
    expect(decoded?.name).toBe('ÆØN🐣');
  });

  it('returns null for garbage input', () => {
    expect(decodePetFromShare('not-base64!!!')).toBeNull();
    expect(decodePetFromShare('aGVsbG8')).toBeNull(); // valid b64, not JSON
  });
});
