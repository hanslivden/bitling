import { CreatureId, getEvolution, EVOLUTION_HOURS } from './creatures';

export type Lineage = 'sunny' | 'stormy' | 'misty';

export const SAVE_VERSION = 2;

export interface PetState {
  version: number;
  id: string;
  creatureId: CreatureId;
  name: string;
  generation: number;    // 1 = first pet; successors inherit the line
  age: number;           // real hours since birth (frozen at death)
  hunger: number;        // 0–4  (4 = full)
  happiness: number;     // 0–4
  weight: number;        // grams — 40+ is overweight and risks sickness
  discipline: number;    // 0–4 — erodes over time; low values cause trouble
  sick: boolean;
  sleeping: boolean;
  lightOff: boolean;
  poopCount: number;     // 0–3
  falseAlarm: boolean;   // pet is calling for no reason — answer with DISC
  falseAlarmTicks: number;
  dead: boolean;
  causeOfDeath?: string;
  careScore: number;     // 0–100
  neglectCount: number;  // times hunger/happiness hit 0
  bornAt: number;        // ms timestamp
  diedAt?: number;
  lastTick: number;      // ms timestamp
  ticksElapsed: number;  // seeds the deterministic tick PRNG
  evolutionStage: number;
  // stats for death certificate / achievements
  mealsEaten: number;
  gamesPlayed: number;
  poopsCleaned: number;
  medicineGiven: number;
  timesSick: number;
  lastRefusal?: number;  // ms timestamp of the last refused meal/game
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

// Night runs 21:00–08:00 local time.  Pets sleep restfully at night and
// get cranky when kept awake; dozing through the day restores nothing.
export function isNight(ts: number): boolean {
  const h = new Date(ts).getHours();
  return h >= 21 || h < 8;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─── Deterministic tick randomness ───────────────────────────────────────────
// Each tick draws from a PRNG seeded by pet id + tick index, so offline
// replay is reproducible and the simulation is unit-testable.

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createNewPet(
  name = 'Blobby',
  lineage: Lineage = 'sunny',
  generation = 1,
): PetState {
  const now = Date.now();
  return {
    version: SAVE_VERSION,
    id: generateId(),
    creatureId: 'egg',
    name,
    lineage,
    generation,
    age: 0,
    hunger: 4,
    happiness: lineage === 'misty' ? 2 : 4,
    weight: 20,
    discipline: lineage === 'stormy' ? 3 : 2,
    sick: false,
    sleeping: false,
    lightOff: false,
    poopCount: 0,
    falseAlarm: false,
    falseAlarmTicks: 0,
    dead: false,
    careScore: 100,
    neglectCount: 0,
    bornAt: now,
    lastTick: now,
    ticksElapsed: 0,
    evolutionStage: 0,
    mealsEaten: 0,
    gamesPlayed: 0,
    poopsCleaned: 0,
    medicineGiven: 0,
    timesSick: 0,
    animFrame: 0,
    emotionFrame: 'idle',
    emotionTimer: 0,
  };
}

// Fill in fields added since the save was written.
function migrate(s: Partial<PetState>): PetState {
  const out = { ...s } as PetState;
  if ((out.version ?? 1) < 2) {
    out.version = 2;
    out.lineage ??= 'sunny';
    out.generation ??= 1;
    out.ticksElapsed ??= 0;
    out.falseAlarm ??= false;
    out.falseAlarmTicks ??= 0;
    out.timesSick ??= (out.medicineGiven ?? 0) > 0 ? 1 : 0;
  }
  return out;
}

export function savePet(state: PetState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export function loadPet(): PetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw) as Partial<PetState>);
  } catch { return null; }
}

export function clearSave(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// Age in real hours, frozen at time of death.
function ageHours(s: PetState, now: number): number {
  return ((s.dead ? s.diedAt ?? now : now) - s.bornAt) / 3_600_000;
}

// ─── Core tick ───────────────────────────────────────────────────────────────
// Called once per TICK_MS.  Returns new state (immutable).
// `now` is the simulated time of this tick (in the past when replaying
// offline ticks), so age, day/night, and time of death stay accurate.
function singleTick(s: PetState, now: number): PetState {
  if (s.dead || s.creatureId === 'egg') return s;

  const age = ageHours(s, now);
  const ticksElapsed = s.ticksElapsed + 1;
  const rand = mulberry32(hashString(s.id) ^ ticksElapsed);
  const night = isNight(now);

  let {
    hunger, happiness, weight, sick, poopCount, careScore, neglectCount,
    discipline, falseAlarm, falseAlarmTicks, timesSick,
  } = s;

  if (s.sleeping) {
    if (night) {
      // restful night sleep: very slow drain, care slowly recovers
      if (rand() < 0.10) hunger = Math.max(0, hunger - 1);
      careScore = Math.min(100, careScore + 1);
    } else {
      // dozing through the day doesn't pause life
      if (rand() < 0.35) hunger = Math.max(0, hunger - 1);
      if (rand() < 0.22) happiness = Math.max(0, happiness - 1);
    }
    return { ...s, hunger, happiness, careScore, age, ticksElapsed };
  }

  // Hunger drops every tick; staying up past bedtime makes the pet miserable
  if (rand() < 0.35) hunger = Math.max(0, hunger - 1);
  if (rand() < (night ? 0.38 : 0.22)) happiness = Math.max(0, happiness - 1);

  // Random poop
  if (rand() < 0.12) poopCount = Math.min(3, poopCount + 1);

  // Discipline slowly erodes
  if (discipline > 0 && rand() < 0.06) discipline -= 1;

  // False alarm: a poorly disciplined pet calls for attention it doesn't
  // need.  Answer with DISC to teach it; ignoring it costs care score.
  if (falseAlarm) {
    falseAlarmTicks += 1;
    if (falseAlarmTicks >= 3) {
      falseAlarm = false;
      falseAlarmTicks = 0;
      careScore = Math.max(0, careScore - 4);
    }
  } else if (discipline <= 2 && hunger >= 2 && happiness >= 2 && !sick && rand() < 0.10) {
    falseAlarm = true;
    falseAlarmTicks = 0;
  }

  // Get sick — bad hygiene, starvation, or obesity
  const sickChance =
    (poopCount >= 3 || hunger === 0 ? 0.18 : 0) + (weight >= 40 ? 0.08 : 0);
  if (!sick && sickChance > 0 && rand() < sickChance) {
    sick = true;
    timesSick += 1;
  }

  // Neglect tracking
  if (hunger === 0 || happiness === 0) neglectCount += 1;

  // Care score update — being overweight counts against care
  const cared = hunger >= 2 && happiness >= 2 && !sick && poopCount === 0 && weight < 40;
  careScore = Math.min(100, Math.max(0, careScore + (cared ? 2 : -3)));

  // Death: 15+ neglect ticks (≈ 1.25 hrs prod, 5 min dev) while in bad shape
  if (neglectCount >= 15 && (hunger === 0 || happiness === 0)) {
    const cause = sick ? 'illness' : hunger === 0 ? 'starvation' : 'loneliness';
    return {
      ...s, age, ticksElapsed, hunger, happiness, poopCount, sick, careScore,
      neglectCount, discipline, falseAlarm, falseAlarmTicks, timesSick,
      dead: true, causeOfDeath: cause, diedAt: now,
    };
  }

  // Weight drift
  if (hunger <= 1) weight = Math.max(10, weight - 1);

  return {
    ...s, age, ticksElapsed, hunger, happiness, weight, sick, poopCount,
    careScore, neglectCount, discipline, falseAlarm, falseAlarmTicks, timesSick,
  };
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
// plays them with a mute check).  A spoiled pet (low discipline) sometimes
// refuses meals and games; refusals bump `lastRefusal` so the UI can react.

function refuses(s: PetState): boolean {
  if (s.discipline > 1) return false;
  return Math.random() < (s.discipline === 0 ? 0.3 : 0.15);
}

export function feedPet(s: PetState): PetState {
  if (s.dead || s.sleeping || s.hunger >= 4) return s;
  if (refuses(s)) return { ...s, lastRefusal: Date.now() };
  return { ...s, hunger: Math.min(4, s.hunger + 2), weight: s.weight + 2, mealsEaten: s.mealsEaten + 1, emotionFrame: 'eat', emotionTimer: 6 };
}

// Applies the result of the left/right guessing mini-game.
export function finishMiniGame(s: PetState, wins: number, rounds: number): PetState {
  if (s.dead || s.sleeping) return s;
  const happyGain = wins >= rounds ? 2 : wins >= rounds / 2 ? 1 : 0;
  const weightLoss = 1 + (wins >= rounds ? 1 : 0);
  return {
    ...s,
    happiness: Math.min(4, s.happiness + happyGain),
    weight: Math.max(10, s.weight - weightLoss),
    gamesPlayed: s.gamesPlayed + 1,
    emotionFrame: happyGain > 0 ? 'happy' : 'idle',
    emotionTimer: happyGain > 0 ? 8 : 0,
  };
}

// Whether the pet will agree to play right now (checked before the
// mini-game starts).
export function willPlay(s: PetState): boolean {
  if (s.dead || s.sleeping) return false;
  return !refuses(s);
}

export function markRefusal(s: PetState): PetState {
  return { ...s, lastRefusal: Date.now() };
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
  if (s.dead) return s;
  // Correctly answering a false alarm teaches the pet and restores care
  if (s.falseAlarm) {
    return {
      ...s,
      falseAlarm: false,
      falseAlarmTicks: 0,
      discipline: Math.min(4, s.discipline + 1),
      careScore: Math.min(100, s.careScore + 3),
      emotionFrame: 'happy',
      emotionTimer: 6,
    };
  }
  if (s.discipline >= 4) return s;
  return { ...s, discipline: Math.min(4, s.discipline + 1) };
}

export function toggleLight(s: PetState): PetState {
  if (s.dead) return s;
  const sleeping = !s.sleeping;
  return { ...s, sleeping, lightOff: sleeping, emotionFrame: sleeping ? 'sleep' : 'idle' };
}
