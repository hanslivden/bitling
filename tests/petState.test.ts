import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createNewPet, applyOfflineTicks, disciplinePet, toggleLight,
  feedPet, finishMiniGame, isNight, loadPet, TICK_MS, SAVE_VERSION,
  type PetState,
} from '../src/lib/petState';

function at(hour: number): number {
  return new Date(2026, 5, 12, hour, 0, 0).getTime();
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('createNewPet', () => {
  it('sets defaults including version and generation', () => {
    const p = createNewPet('TEST', 'stormy', 3);
    expect(p.version).toBe(SAVE_VERSION);
    expect(p.generation).toBe(3);
    expect(p.lineage).toBe('stormy');
    expect(p.discipline).toBe(3); // stormy bonus
    expect(p.creatureId).toBe('egg');
    expect(p.falseAlarm).toBe(false);
  });
});

describe('applyOfflineTicks', () => {
  it('is deterministic: replaying the same window twice gives identical results', () => {
    vi.setSystemTime(at(12));
    const base = { ...createNewPet('DET'), creatureId: 'sunnling' as const };
    base.bornAt = at(12) - 10 * 3_600_000;
    base.lastTick = at(12) - 20 * TICK_MS;

    const a = applyOfflineTicks({ ...base });
    const b = applyOfflineTicks({ ...base });
    expect(a.state).toEqual(b.state);
    expect(a.ticks).toBe(20);
  });

  it('kills a critically neglected pet and freezes age at time of death', () => {
    vi.setSystemTime(at(12));
    const p = { ...createNewPet('DOOMED'), creatureId: 'sunnling' as const };
    p.bornAt = at(12) - 24 * 3_600_000;
    p.lastTick = at(12) - 10 * TICK_MS;
    p.hunger = 0;
    p.happiness = 0;
    p.neglectCount = 20;

    const { state } = applyOfflineTicks(p);
    expect(state.dead).toBe(true);
    expect(state.diedAt).toBeDefined();
    expect(state.causeOfDeath).toBeTruthy();
    // age frozen at diedAt, not at load time
    expect(state.age).toBeCloseTo((state.diedAt! - p.bornAt) / 3_600_000, 5);
    expect(state.diedAt!).toBeLessThan(at(12));
  });

  it('hatches an egg according to lineage', () => {
    vi.setSystemTime(at(12));
    const p = createNewPet('EGGY', 'misty');
    p.bornAt = at(12) - 3_600_000; // an hour old
    p.lastTick = at(12) - TICK_MS;

    const { state } = applyOfflineTicks(p);
    expect(state.creatureId).toBe('wisp');
  });

  it('night sleep restores care score; day sleep does not', () => {
    const makeSleeper = (now: number): PetState => {
      const p = { ...createNewPet('ZZZ'), creatureId: 'puffi' as const };
      p.bornAt = now - 48 * 3_600_000;
      p.lastTick = now - TICK_MS;
      p.sleeping = true;
      p.careScore = 50;
      return p;
    };

    vi.setSystemTime(at(3)); // 3 AM — night
    const night = applyOfflineTicks(makeSleeper(at(3))).state;
    expect(night.careScore).toBe(51);

    vi.setSystemTime(at(12)); // noon — day
    const day = applyOfflineTicks(makeSleeper(at(12))).state;
    expect(day.careScore).toBe(50);
  });

  it('does not let a dead pet evolve', () => {
    vi.setSystemTime(at(12));
    const p = { ...createNewPet('GHOST'), creatureId: 'sunnling' as const };
    p.bornAt = at(12) - 80 * 3_600_000; // way past evolution threshold
    p.lastTick = at(12) - 5 * TICK_MS;
    p.dead = true;
    p.diedAt = at(12) - 4 * TICK_MS;

    const { state, ticks } = applyOfflineTicks(p);
    expect(ticks).toBe(0);
    expect(state.creatureId).toBe('sunnling');
  });
});

describe('isNight', () => {
  it('treats 21:00–08:00 as night', () => {
    expect(isNight(at(23))).toBe(true);
    expect(isNight(at(3))).toBe(true);
    expect(isNight(at(7))).toBe(true);
    expect(isNight(at(8))).toBe(false);
    expect(isNight(at(12))).toBe(false);
    expect(isNight(at(20))).toBe(false);
    expect(isNight(at(21))).toBe(true);
  });
});

describe('actions', () => {
  it('disciplining during a false alarm clears it and rewards', () => {
    const p = { ...createNewPet('NAUGHTY'), creatureId: 'puffi' as const };
    p.falseAlarm = true;
    p.discipline = 1;
    p.careScore = 50;

    const n = disciplinePet(p);
    expect(n.falseAlarm).toBe(false);
    expect(n.discipline).toBe(2);
    expect(n.careScore).toBe(53);
  });

  it('a spoiled pet can refuse food', () => {
    vi.setSystemTime(at(12));
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // force refusal roll
    const p = { ...createNewPet('BRAT'), creatureId: 'puffi' as const };
    p.discipline = 0;
    p.hunger = 2;

    const n = feedPet(p);
    expect(n.hunger).toBe(2); // not fed
    expect(n.lastRefusal).toBe(at(12));
  });

  it('a disciplined pet never refuses food', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const p = { ...createNewPet('GOOD'), creatureId: 'puffi' as const };
    p.discipline = 4;
    p.hunger = 2;

    const n = feedPet(p);
    expect(n.hunger).toBe(4);
    expect(n.mealsEaten).toBe(1);
  });

  it('mini-game results scale with wins', () => {
    const p = { ...createNewPet('GAMER'), creatureId: 'puffi' as const };
    p.happiness = 1;
    p.weight = 30;

    const perfect = finishMiniGame(p, 4, 4);
    expect(perfect.happiness).toBe(3); // +2
    expect(perfect.weight).toBe(28);   // -2
    expect(perfect.gamesPlayed).toBe(1);

    const loss = finishMiniGame(p, 0, 4);
    expect(loss.happiness).toBe(1);    // no gain
    expect(loss.weight).toBe(29);      // still burns 1
    expect(loss.gamesPlayed).toBe(1);
  });

  it('toggleLight flips sleeping', () => {
    const p = { ...createNewPet('LAMP'), creatureId: 'puffi' as const };
    const asleep = toggleLight(p);
    expect(asleep.sleeping).toBe(true);
    expect(toggleLight(asleep).sleeping).toBe(false);
  });
});

describe('save migration', () => {
  it('upgrades a v1 save to the current version', () => {
    const v1 = { ...createNewPet('OLD') } as Record<string, unknown>;
    delete v1.version;
    delete v1.generation;
    delete v1.ticksElapsed;
    delete v1.falseAlarm;
    delete v1.falseAlarmTicks;
    delete v1.timesSick;

    const store = new Map<string, string>([['bitling_pet_v1', JSON.stringify(v1)]]);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });

    const loaded = loadPet();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(SAVE_VERSION);
    expect(loaded!.generation).toBe(1);
    expect(loaded!.falseAlarm).toBe(false);
    expect(loaded!.ticksElapsed).toBe(0);
  });
});
