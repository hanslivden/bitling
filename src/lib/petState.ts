import { CreatureId, getEvolution, EVOLUTION_HOURS } from './creatures';

export type Lineage = 'sunny' | 'stormy' | 'misty';

export interface PetState {
  id: string;
  creatureId: CreatureId;
  name: string;
  age: number;           // real hours since birth
  hunger: number;        // 0–4  (4 = full)
  happiness: number;     // 0–4
  weight: number;        // grams
  discipline: number;    // 0–4
  sick: boolean;
  sleeping: boolean;
  lightOff: boolean;
  poopCount: number;     // 0–3
  dead: boolean;
  causeOfDeath?: string;
  careScore: number;     // 0–100
  neglectCount: number;  // times hunger/happiness hit 0
  bornAt: number;        // ms timestamp
  diedAt?: number;
  lastTick: number;      // ms timestamp
  evolutionStage: number;
  // stats for death certificate
  mealsEaten: number;
  gamesPlayed: number;
  poopsCleaned: number;
  medicineGiven: number;
  // animation
  animFrame: number;
  emotionFrame: 'idle' | 'eat' | 'happy' | 'sleep';
  emotionTimer: number;
  lineage: Lineage;
}

const STORAGE_KEY = 'bitling_pet_v1';

// 5 min per tick in prod, 20 sec in dev for easy testing
export const TICK_MS =
  process.env.NODE_ENV === 'development' ? 20_000 : 5 * 60_000;

export function generateId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createNewPet(name = 'Blobby', lineage: Lineage = 'sunny'): PetState {
  const now = Date.now();
  return {
    id: generateId(),
    creatureId: 'egg',
    name,
    lineage,
    age: 0,
    hunger: 4,
    happiness: lineage === 'misty' ? 2 : 4,
    weight: 20,
    discipline: lineage === 'stormy' ? 3 : 2,
    sick: false,
    sleeping: false,
    lightOff: false,
    poopCount: 0,
    dead: false,
    careScore: 100,
    neglectCount: 0,
    bornAt: now,
    lastTick: now,
    evolutionStage: 0,
    mealsEaten: 0,
    gamesPlayed: 0,
    poopsCleaned: 0,
    medicineGiven: 0,
    animFrame: 0,
    emotionFrame: 'idle',
    emotionTimer: 0,
  };
}

export function savePet(state: PetState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export function loadPet(): PetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PetState;
    if (!state.lineage) state.lineage = 'sunny';
    return state;
  } catch { return null; }
}

// Age in real hours, frozen at time of death.
function ageHours(s: PetState, now: number): number {
  return ((s.dead ? s.diedAt ?? now : now) - s.bornAt) / 3_600_000;
}

// ─── Core tick ───────────────────────────────────────────────────────────────
// Called once per TICK_MS.  Returns new state (immutable).
// `now` is the simulated time of this tick (in the past when replaying
// offline ticks), so age and time of death stay accurate.
function singleTick(s: PetState, now: number): PetState {
  if (s.dead || s.creatureId === 'egg') return s;

  const age = ageHours(s, now);
  let { hunger, happiness, weight, sick, poopCount, careScore, neglectCount } = s;

  if (s.sleeping) {
    // very slow drain while asleep
    if (Math.random() < 0.15) hunger = Math.max(0, hunger - 1);
    return { ...s, hunger, age };
  }

  // Hunger drops every tick (5 min prod, 20 s dev)
  // At 12 ticks/hour prod → 1 heart every ~8 ticks = 40 min
  if (Math.random() < 0.35) hunger = Math.max(0, hunger - 1);

  // Happiness drops slower
  if (Math.random() < 0.22) happiness = Math.max(0, happiness - 1);

  // Random poop
  if (Math.random() < 0.12) poopCount = Math.min(3, poopCount + 1);

  // Get sick
  if ((poopCount >= 3 || hunger === 0) && !sick && Math.random() < 0.18) sick = true;

  // Neglect tracking
  if (hunger === 0 || happiness === 0) neglectCount += 1;

  // Care score update
  const cared = hunger >= 2 && happiness >= 2 && !sick && poopCount === 0;
  careScore = Math.min(100, Math.max(0, careScore + (cared ? 2 : -3)));

  // Death: 15+ neglect ticks (≈ 1.25 hrs prod, 5 min dev) while in bad shape
  if (neglectCount >= 15 && (hunger === 0 || happiness === 0)) {
    const cause = sick ? 'illness' : hunger === 0 ? 'starvation' : 'loneliness';
    return { ...s, age, hunger, happiness, poopCount, sick, careScore, neglectCount, dead: true, causeOfDeath: cause, diedAt: now };
  }

  // Weight drift
  if (hunger <= 1) weight = Math.max(10, weight - 1);

  return { ...s, age, hunger, happiness, weight, sick, poopCount, careScore, neglectCount };
}

function checkEvolution(s: PetState): { state: PetState; evolved: boolean } {
  if (s.dead) return { state: s, evolved: false };
  const hours = (Date.now() - s.bornAt) / 3_600_000;
  const threshold = EVOLUTION_HOURS[s.creatureId];
  if (threshold === undefined || hours < threshold) return { state: s, evolved: false };

  const nextId = getEvolution(s.creatureId, s.careScore, s.neglectCount, s.lineage);
  if (!nextId) return { state: s, evolved: false };

  const next: PetState = { ...s, creatureId: nextId, evolutionStage: s.evolutionStage + 1, animFrame: 0, emotionFrame: 'happy', emotionTimer: 10 };
  return { state: next, evolved: true };
}

// Apply all missed ticks since lastTick (called on page load)
export function applyOfflineTicks(state: PetState): { state: PetState; ticks: number } {
  if (state.dead) return { state, ticks: 0 };
  const now = Date.now();
  const elapsed = now - state.lastTick;
  const ticks = Math.min(Math.floor(elapsed / TICK_MS), 500); // cap at ~41 hrs prod
  let s = { ...state };
  for (let i = 0; i < ticks; i++) {
    s = singleTick(s, state.lastTick + (i + 1) * TICK_MS);
    if (s.dead) break;
  }
  const { state: evolved } = checkEvolution(s);
  return { state: { ...evolved, age: ageHours(evolved, now), lastTick: now }, ticks };
}

export function doGameTick(s: PetState): PetState {
  if (s.dead) return s;
  const now = Date.now();
  const ticked = singleTick({ ...s, age: ageHours(s, now), lastTick: now }, now);
  const { state: checked } = checkEvolution(ticked);
  return checked;
}

export function tickAnimation(s: PetState): PetState {
  const nextFrame = (s.animFrame + 1) % 2;
  const nextTimer = Math.max(0, s.emotionTimer - 1);
  return { ...s, animFrame: nextFrame, emotionTimer: nextTimer, emotionFrame: nextTimer === 0 ? 'idle' : s.emotionFrame };
}

// ─── Actions ────────────────────────────────────────────────────────────────
// Pure state transitions — sounds/animations are the caller's job (Device.tsx
// plays them with a mute check).

export function feedPet(s: PetState): PetState {
  if (s.dead || s.sleeping || s.hunger >= 4) return s;
  return { ...s, hunger: Math.min(4, s.hunger + 2), weight: s.weight + 2, mealsEaten: s.mealsEaten + 1, emotionFrame: 'eat', emotionTimer: 6 };
}

export function playWithPet(s: PetState): PetState {
  if (s.dead || s.sleeping || s.happiness >= 4) return s;
  return { ...s, happiness: Math.min(4, s.happiness + 1), weight: Math.max(10, s.weight - 1), gamesPlayed: s.gamesPlayed + 1, emotionFrame: 'happy', emotionTimer: 8 };
}

export function cleanPoop(s: PetState): PetState {
  if (s.dead || s.poopCount === 0) return s;
  return { ...s, poopCount: 0, poopsCleaned: s.poopsCleaned + 1 };
}

export function giveMedicine(s: PetState): PetState {
  if (s.dead || !s.sick) return s;
  return { ...s, sick: false, medicineGiven: s.medicineGiven + 1 };
}

export function disciplinePet(s: PetState): PetState {
  if (s.dead || s.discipline >= 4) return s;
  return { ...s, discipline: Math.min(4, s.discipline + 1) };
}

export function toggleLight(s: PetState): PetState {
  if (s.dead) return s;
  const sleeping = !s.sleeping;
  return { ...s, sleeping, lightOff: sleeping, emotionFrame: sleeping ? 'sleep' : 'idle' };
}
