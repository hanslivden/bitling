// Badges earned over a pet's life, shown on the death certificate.

import type { PetState } from './petState';

export interface Achievement {
  id: string;
  label: string;
  desc: string;
}

export function getAchievements(pet: PetState): Achievement[] {
  const out: Achievement[] = [];
  const ageH = Math.floor(pet.age);

  if (ageH >= 168)     out.push({ id: 'elder',    label: 'ELDER',     desc: 'Lived a full week' });
  else if (ageH >= 72) out.push({ id: 'survivor', label: 'SURVIVOR',  desc: 'Lived 3+ days' });

  if (pet.timesSick === 0 && ageH >= 24)
    out.push({ id: 'ironbelly', label: 'IRON BELLY', desc: 'Never got sick' });
  if (pet.mealsEaten >= 50)
    out.push({ id: 'wellfed',   label: 'WELL FED',   desc: '50+ meals eaten' });
  if (pet.gamesPlayed >= 25)
    out.push({ id: 'playful',   label: 'PLAYFUL',    desc: '25+ games played' });
  if (pet.poopsCleaned >= 20)
    out.push({ id: 'spotless',  label: 'SPOTLESS',   desc: '20+ messes cleaned' });
  if (pet.careScore >= 90)
    out.push({ id: 'perfect',   label: 'BELOVED',    desc: 'Died with 90%+ care' });
  if (pet.discipline >= 4)
    out.push({ id: 'raised',    label: 'WELL RAISED', desc: 'Max discipline' });
  if (pet.evolutionStage >= 3)
    out.push({ id: 'evolved',   label: 'FINAL FORM', desc: 'Reached the last evolution' });
  if (pet.generation >= 3)
    out.push({ id: 'dynasty',   label: 'DYNASTY',    desc: 'Generation 3 or later' });

  return out;
}
