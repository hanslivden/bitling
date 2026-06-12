'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PetState, createNewPet, loadPet, savePet, applyOfflineTicks,
  doGameTick, tickAnimation, feedPet, finishMiniGame, willPlay, markRefusal,
  cleanPoop, giveMedicine, disciplinePet, toggleLight, clearSave, TICK_MS,
} from '@/lib/petState';
import { sounds, setMuted, getMuted } from '@/lib/sounds';
import { drawCanvas, CW, CH, AnimationType, AnimState, ANIM_FRAMES } from '@/lib/canvasRenderer';
import { buildShareUrl, buildBookmarkUrl, decodePetFromShare } from '@/lib/share';
import { getDiscovered, recordDiscovery } from '@/lib/dex';
import type { CreatureId } from '@/lib/creatures';
import DeathCertificate from './DeathCertificate';
import Leaderboard from './Leaderboard';
import Tutorial from './Tutorial';
import DexModal from './DexModal';
import ActionMenu, { ACTIONS, ACTION_DEFS, type Action } from './ActionMenu';
import StarterPicker from './StarterPicker';
import type { Lineage } from '@/lib/petState';

// Fire-and-forget leaderboard submission for a dead pet.
function submitScore(n: PetState) {
  fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: n.id,
      petName: n.name,
      creatureId: n.creatureId,
      ageHours: Math.floor(n.age),
      causeOfDeath: n.causeOfDeath ?? 'unknown',
      diedAt: n.diedAt ?? Date.now(),
      careScore: n.careScore,
      mealsEaten: n.mealsEaten,
      gamesPlayed: n.gamesPlayed,
      generation: n.generation ?? 1,
    }),
  }).catch(() => {});
}

const MINI_GAME_ROUNDS = 4;

interface MiniGame {
  round: number;
  wins: number;
  phase: 'guess' | 'reveal' | 'result';
  lastActual?: 'L' | 'R';
  lastWin?: boolean;
}

export default function Device() {
  const [pet, setPet] = useState<PetState | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDex, setShowDex] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [attention, setAttention] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showStarter, setShowStarter] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [discovered, setDiscovered] = useState<CreatureId[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [miniGame, setMiniGame] = useState<MiniGame | null>(null);
  const [nextGen, setNextGen] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petRef = useRef<PetState | null>(null);
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gameTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeAnimRef = useRef<{ type: AnimationType; startFrame: number } | null>(null);
  const rafFrameRef = useRef(0);
  const miniGameRef = useRef<MiniGame | null>(null);
  const alertsRef = useRef(false);
  const attentionRef = useRef(false);

  const triggerAnim = useCallback((type: AnimationType) => {
    activeAnimRef.current = { type, startFrame: rafFrameRef.current };
  }, []);

  const setMiniGameBoth = useCallback((g: MiniGame | null) => {
    miniGameRef.current = g;
    setMiniGame(g);
  }, []);

  const discover = useCallback((id: CreatureId) => {
    if (id === 'egg') return;
    recordDiscovery(id);
    setDiscovered(getDiscovered());
  }, []);

  // ── Load pet ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setDiscovered(getDiscovered());
    setAlertsEnabled(
      typeof Notification !== 'undefined'
      && Notification.permission === 'granted'
      && localStorage.getItem('bitling_alerts') === '1',
    );

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (viewParam) {
      const shared = decodePetFromShare(viewParam);
      if (shared && shared.id) {
        const viewPet = { ...createNewPet(), ...shared } as PetState;
        setPet(viewPet);
        petRef.current = viewPet;
        setIsViewing(true);
        return;
      }
    }

    const loaded = loadPet();
    if (!loaded) {
      setShowStarter(true);
      return;
    }
    const { state } = applyOfflineTicks(loaded);
    if (state.dead && !loaded.dead) submitScore(state); // died while away
    if (state.creatureId !== 'egg') recordDiscovery(state.creatureId);
    setDiscovered(getDiscovered());

    // Bookmark URL
    const u = new URL(window.location.href);
    u.searchParams.set('pet', state.id);
    u.searchParams.delete('view');
    window.history.replaceState({}, '', u.toString());

    setPet(state);
    savePet(state);
    petRef.current = state;
    if (state.dead) setShowDeath(true);
  }, []);

  useEffect(() => { alertsRef.current = alertsEnabled; }, [alertsEnabled]);

  // ── Animation tick ────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (isViewing) return;
      setPet(s => {
        if (!s) return s;
        const n = tickAnimation(s);
        petRef.current = n;
        return n;
      });
    }, 800);
    return () => clearInterval(id);
  }, [isViewing]);

  // ── Game tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isViewing) return;
    const id = setInterval(() => {
      setPet(s => {
        if (!s || s.dead) return s;
        const n = doGameTick(s);
        savePet(n);
        petRef.current = n;

        if (n.creatureId !== s.creatureId) {
          if (!getMuted()) (s.creatureId === 'egg' ? sounds.hatch : sounds.evolve)();
          triggerAnim('evolve');
          discover(n.creatureId);
        }

        if (n.dead && !s.dead) {
          if (!getMuted()) sounds.death();
          setShowDeath(true);
          submitScore(n);
        }

        const needsAttention =
          n.falseAlarm || n.hunger <= 1 || n.happiness <= 1 || n.sick || n.poopCount >= 2;
        if (needsAttention && !n.sleeping) {
          setAttention(true);
          if (!getMuted()) sounds.attention();
          // Push a system notification if the tab is hidden and alerts are on
          if (!attentionRef.current && alertsRef.current && document.hidden
              && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification('BITLING', {
                body: `${n.name} needs you!`,
                icon: '/icon-192.png',
                tag: 'bitling-attention',
              });
            } catch { /* not supported */ }
          }
          attentionRef.current = true;
        } else {
          setAttention(false);
          attentionRef.current = false;
        }

        return n;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isViewing, triggerAnim, discover]);

  // ── Canvas RAF loop ───────────────────────────────────────────────────────
  useEffect(() => {
    let raf: number;
    let rafTick = 0;
    const loop = () => {
      rafTick++;
      // Advance animation frame every 4 RAF ticks (~15fps) — 75% slower than ~30fps
      if (rafTick % 4 === 0) rafFrameRef.current++;
      if (canvasRef.current && petRef.current) {
        let animState: AnimState | null = null;
        if (activeAnimRef.current) {
          const elapsed = rafFrameRef.current - activeAnimRef.current.startFrame;
          const total = ANIM_FRAMES[activeAnimRef.current.type];
          if (elapsed < total) {
            animState = { type: activeAnimRef.current.type, frame: elapsed };
          } else {
            activeAnimRef.current = null;
          }
        }
        drawCanvas(canvasRef.current, petRef.current, attention, animState);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [attention]);

  // ── Menu auto-close ───────────────────────────────────────────────────────
  const resetMenuTimer = useCallback(() => {
    clearTimeout(menuTimerRef.current);
    menuTimerRef.current = setTimeout(() => setShowMenu(false), 5000);
  }, []);

  // ── Mini-game (left/right guessing, classic Gen-1 style) ─────────────────
  const applyPetUpdate = useCallback((fn: (s: PetState) => PetState) => {
    setPet(s => {
      if (!s) return s;
      const n = fn(s);
      savePet(n);
      petRef.current = n;
      return n;
    });
  }, []);

  const endMiniGame = useCallback((g: MiniGame) => {
    applyPetUpdate(s => finishMiniGame(s, g.wins, MINI_GAME_ROUNDS));
    if (!getMuted()) (g.wins >= MINI_GAME_ROUNDS / 2 ? sounds.gameWin : sounds.gameLose)();
    if (g.wins >= MINI_GAME_ROUNDS / 2) triggerAnim('attention');
    setMiniGameBoth({ ...g, phase: 'result' });
    gameTimerRef.current = setTimeout(() => setMiniGameBoth(null), 1800);
  }, [applyPetUpdate, setMiniGameBoth, triggerAnim]);

  const handleGuess = useCallback((guess: 'L' | 'R') => {
    const g = miniGameRef.current;
    if (!g || g.phase !== 'guess') return;
    const actual: 'L' | 'R' = Math.random() < 0.5 ? 'L' : 'R';
    const win = guess === actual;
    if (!getMuted()) (win ? sounds.roundWin : sounds.roundLose)();
    const next: MiniGame = { ...g, phase: 'reveal', lastActual: actual, lastWin: win, wins: g.wins + (win ? 1 : 0) };
    setMiniGameBoth(next);
    gameTimerRef.current = setTimeout(() => {
      const cur = miniGameRef.current;
      if (!cur || cur.phase !== 'reveal') return;
      if (cur.round >= MINI_GAME_ROUNDS) endMiniGame(cur);
      else setMiniGameBoth({ ...cur, round: cur.round + 1, phase: 'guess' });
    }, 900);
  }, [endMiniGame, setMiniGameBoth]);

  const quitMiniGame = useCallback(() => {
    clearTimeout(gameTimerRef.current);
    setMiniGameBoth(null);
  }, [setMiniGameBoth]);

  useEffect(() => () => clearTimeout(gameTimerRef.current), []);

  // ── Run a menu action: update state, play its sound, kick off its anim ────
  const executeAction = useCallback((action: Action) => {
    const cur = petRef.current;
    if (!cur || cur.dead || isViewing) return;
    if (action === 'status') { setShowStatus(s => !s); setShowMenu(false); return; }

    // PLAY launches the mini-game (unless the pet refuses or is asleep)
    if (action === 'play') {
      setShowMenu(false);
      if (cur.sleeping || cur.creatureId === 'egg') return;
      if (!willPlay(cur)) {
        applyPetUpdate(markRefusal);
        if (!getMuted()) sounds.refuse();
        triggerAnim('refuse');
        return;
      }
      setMiniGameBoth({ round: 1, wins: 0, phase: 'guess' });
      return;
    }

    setPet(s => {
      if (!s) return s;
      let n = s;
      switch (action) {
        case 'food':
          n = feedPet(s);
          if (n.lastRefusal !== s.lastRefusal) {
            if (!getMuted()) sounds.refuse();
            triggerAnim('refuse');
          } else if (n !== s) {
            if (!getMuted()) sounds.feed();
            triggerAnim('feed');
          }
          break;
        case 'light':
          n = toggleLight(s);
          if (!getMuted()) (n.sleeping ? sounds.sleep : sounds.wake)();
          triggerAnim(n.sleeping ? 'sleep' : 'wake');
          break;
        case 'medicine':
          n = giveMedicine(s);
          if (!getMuted()) sounds.medicine();
          triggerAnim('medicine');
          break;
        case 'toilet':
          n = cleanPoop(s);
          if (!getMuted()) sounds.clean();
          triggerAnim('clean');
          break;
        case 'discipline':
          n = disciplinePet(s);
          if (s.falseAlarm && !n.falseAlarm) {
            // correctly answered a false alarm — reward
            if (!getMuted()) sounds.happy();
            triggerAnim('attention');
            setAttention(false);
            attentionRef.current = false;
          } else {
            if (!getMuted()) sounds.discipline();
            triggerAnim('discipline');
          }
          break;
        case 'attention':
          if (!getMuted()) sounds.happy();
          triggerAnim('attention');
          setAttention(false);
          attentionRef.current = false;
          break;
      }
      savePet(n);
      petRef.current = n;
      return n;
    });
    setShowMenu(false);
  }, [isViewing, triggerAnim, applyPetUpdate, setMiniGameBoth]);

  // ── Button handlers ───────────────────────────────────────────────────────
  const pressLeft = () => {
    if (!pet || isViewing) return;
    if (miniGame) { handleGuess('L'); return; }
    if (pet.creatureId === 'egg') return;
    if (showStatus) { setShowStatus(false); return; }
    if (!showMenu) { setShowMenu(true); resetMenuTimer(); return; }
    setSelectedAction(i => (i - 1 + ACTIONS.length) % ACTIONS.length);
    resetMenuTimer();
    if (!getMuted()) sounds.beep();
  };

  const pressMiddle = () => {
    if (!pet || pet.dead || isViewing) return;
    if (miniGame) { quitMiniGame(); return; }
    if (pet.creatureId === 'egg') return;
    if (showStatus) { setShowStatus(false); return; }
    if (!showMenu) { setShowMenu(true); resetMenuTimer(); return; }
    executeAction(ACTIONS[selectedAction]);
  };

  const pressRight = () => {
    if (!pet || isViewing) return;
    if (miniGame) { handleGuess('R'); return; }
    if (pet.creatureId === 'egg') return;
    if (showStatus) { setShowStatus(false); return; }
    if (!showMenu) { setShowMenu(true); resetMenuTimer(); return; }
    setSelectedAction(i => (i + 1) % ACTIONS.length);
    resetMenuTimer();
    if (!getMuted()) sounds.beep();
  };

  // ── Keyboard controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setShowLeaderboard(false); setShowTutorial(false); setShowDex(false); setShowStatus(false);
        return;
      }
      if (showLeaderboard || showTutorial || showDex || showDeath) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); pressLeft(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); pressRight(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pressMiddle(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (!pet) return;
    const url = buildShareUrl(pet);
    if (navigator.share) {
      navigator.share({ title: `My Bitling — ${pet.name}`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareMsg('Share link copied!');
        setTimeout(() => setShareMsg(''), 2500);
      });
    }
  };

  const handleCopyBookmark = () => {
    if (!pet) return;
    navigator.clipboard.writeText(buildBookmarkUrl(pet.id)).then(() => {
      setShareMsg('Bookmark URL copied!');
      setTimeout(() => setShareMsg(''), 2500);
    });
  };

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const toggleAlerts = async () => {
    if (alertsEnabled) {
      localStorage.setItem('bitling_alerts', '0');
      setAlertsEnabled(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      setShareMsg('Notifications not supported here');
      setTimeout(() => setShareMsg(''), 2500);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      localStorage.setItem('bitling_alerts', '1');
      setAlertsEnabled(true);
      setShareMsg('Alerts on — we’ll ping you when it needs care');
      setTimeout(() => setShareMsg(''), 2500);
    }
  };

  const startNewPet = () => {
    setNextGen((petRef.current?.generation ?? 0) + 1);
    setShowDeath(false);
    setShowStarter(true);
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
    clearSave();
    setPet(null);
    petRef.current = null;
    setShowDeath(false);
    setNextGen(1);
    setShowStarter(true);
    setConfirmReset(false);
  };

  const handleStarterSelect = (lineage: Lineage, name: string) => {
    const n = createNewPet(name, lineage, nextGen);
    savePet(n);
    setPet(n);
    petRef.current = n;
    setShowStarter(false);
    const u = new URL(window.location.href);
    u.searchParams.set('pet', n.id);
    window.history.replaceState({}, '', u.toString());
  };

  if (showStarter) {
    return <StarterPicker onCreate={handleStarterSelect} generation={nextGen} />;
  }

  if (!pet) {
    return (
      <div style={{ fontFamily: 'var(--font-press-start)', color: '#4ADE80', fontSize: 10, letterSpacing: 2, animation: 'pulse 1s infinite' }}>
        LOADING…
      </div>
    );
  }

  const ageH = Math.floor(pet.age);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

      {/* Title */}
      <h1 className="game-title">BITLING</h1>
      {isViewing && (
        <p style={{ fontFamily: 'var(--font-vt323)', color: '#6D28D9', fontSize: 16 }}>
          👁 Viewing {pet.name}&apos;s pet
        </p>
      )}

      {/* ── Device shell ── */}
      <div className="device">

        {/* Keyring hole + attention LED */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 7 }} /> {/* spacer to center keyring */}
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'linear-gradient(145deg, #3B0764, #1E0440)',
            border: '2px solid #4C1D95',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
          }} />
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: attention && !pet.sleeping ? '#EF4444' : '#2D0A0A',
            boxShadow: attention && !pet.sleeping ? '0 0 6px #EF4444' : 'none',
            animation: attention && !pet.sleeping ? 'blink 0.6s infinite' : 'none',
            transition: 'background 0.3s',
          }} />
        </div>

        {/* Screen bezel + action menu */}
        <div className="screen-bezel">

          {/* Screen */}
          <div className="screen-inner crt">
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              style={{ display: 'block', width: 192, height: 168 }}
            />
          </div>

          {/* Action menu — slides in below screen */}
          <ActionMenu
            visible={showMenu && !miniGame}
            selected={selectedAction}
            onSelect={setSelectedAction}
            onExecute={(i) => executeAction(ACTIONS[i])}
          />

          {/* Mini-game overlay */}
          {miniGame && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(10, 26, 10, 0.96)',
              borderRadius: 8,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              gap: 8, padding: 12,
              fontFamily: 'var(--font-press-start)',
              color: '#4ADE80', zIndex: 10,
            }}>
              {miniGame.phase === 'result' ? (
                <>
                  <div style={{ fontSize: 8 }}>
                    {miniGame.wins === MINI_GAME_ROUNDS ? 'PERFECT!'
                      : miniGame.wins >= MINI_GAME_ROUNDS / 2 ? 'NICE!' : 'AWW…'}
                  </div>
                  <div style={{ fontSize: 7, color: '#86EFAC' }}>
                    {miniGame.wins}/{MINI_GAME_ROUNDS} WINS
                  </div>
                  <div style={{ fontSize: 5, color: '#166534' }}>
                    {miniGame.wins >= MINI_GAME_ROUNDS / 2 ? '+HAPPINESS  −WEIGHT' : 'BETTER LUCK NEXT TIME'}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 6 }}>ROUND {miniGame.round}/{MINI_GAME_ROUNDS}</div>
                  <div style={{ fontSize: 5, color: '#86EFAC', textAlign: 'center', lineHeight: 1.8 }}>
                    WHICH WAY WILL<br />{pet.name} LOOK?
                  </div>
                  {miniGame.phase === 'reveal' ? (
                    <div style={{ fontSize: 12, color: miniGame.lastWin ? '#4ADE80' : '#F87171' }}>
                      {miniGame.lastActual === 'L' ? '◀' : '▶'} {miniGame.lastWin ? 'HIT!' : 'MISS'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button className="pixel-btn" style={{ fontSize: 10, padding: '6px 12px' }} onClick={() => handleGuess('L')}>◀</button>
                      <button className="pixel-btn" style={{ fontSize: 10, padding: '6px 12px' }} onClick={() => handleGuess('R')}>▶</button>
                    </div>
                  )}
                  <div style={{ fontSize: 5, color: '#166534' }}>
                    {'★'.repeat(miniGame.wins)}{'·'.repeat(MINI_GAME_ROUNDS - miniGame.wins)} · CENTER QUITS
                  </div>
                </>
              )}
            </div>
          )}

          {/* Status overlay (shows on STATUS action) */}
          {showStatus && !miniGame && (
            <div
              onClick={() => setShowStatus(false)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(10, 26, 10, 0.96)',
                borderRadius: 8,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'flex-start',
                gap: 5, padding: '12px 16px',
                fontFamily: 'var(--font-press-start)',
                fontSize: 6, color: '#4ADE80',
                cursor: 'pointer', zIndex: 10,
              }}
            >
              <div>NAME: {pet.name}</div>
              <div>GEN : {pet.generation ?? 1}</div>
              <div>AGE : {ageH > 48 ? `${Math.floor(ageH/24)}D ${ageH%24}H` : `${ageH}H`}</div>
              <div style={{ color: pet.weight >= 40 ? '#F87171' : '#4ADE80' }}>
                WT  : {pet.weight}G{pet.weight >= 40 ? ' !' : ''}
              </div>
              <div>DISC: {'|'.repeat(pet.discipline)}{'·'.repeat(4-pet.discipline)}</div>
              <div>CARE: {pet.careScore}%</div>
              <div style={{ marginTop: 4, fontSize: 5, color: '#166534' }}>TAP TO CLOSE</div>
            </div>
          )}
        </div>

        {/* Pet name display */}
        <div style={{
          textAlign: 'center', marginBottom: 12, marginTop: 4,
          fontFamily: 'var(--font-vt323)', fontSize: 20,
          color: '#C4B5FD', letterSpacing: 3,
        }}>
          {pet.name}
          {(pet.generation ?? 1) > 1 && (
            <span style={{ color: '#6D28D9', fontSize: 13 }}> GEN {pet.generation}</span>
          )}
          {pet.dead && <span style={{ color: '#6B7280', fontSize: 14 }}> RIP</span>}
        </div>

        {/* Buttons row */}
        <div className="btn-row">
          {/* Left button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button className="game-btn" onClick={pressLeft} disabled={isViewing} aria-label="Previous action">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <polygon points="9,2 3,6 9,10" />
              </svg>
            </button>
            <span style={{
              fontFamily: 'var(--font-press-start)', fontSize: 4.5,
              color: showMenu || miniGame ? '#7C3AED' : '#2D1060', letterSpacing: 0.5,
            }}>
              {miniGame ? 'LEFT' : pet.creatureId === 'egg' ? '···' : showMenu ? 'PREV' : 'MENU'}
            </span>
          </div>

          {/* Middle button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button className="game-btn center" onClick={pressMiddle} disabled={isViewing} aria-label="Confirm">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="5" cy="5" r="4" />
              </svg>
            </button>
            <span style={{
              fontFamily: 'var(--font-press-start)', fontSize: 4.5,
              color: showMenu || miniGame ? '#EC4899' : '#2D1060', letterSpacing: 0.5,
            }}>
              {miniGame ? 'QUIT' : pet.creatureId === 'egg' ? 'WAIT' : showMenu
                ? (ACTION_DEFS[ACTIONS[selectedAction] as Action]?.label ?? 'OK')
                : 'OPEN'}
            </span>
          </div>

          {/* Right button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button className="game-btn" onClick={pressRight} disabled={isViewing} aria-label="Next action">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <polygon points="3,2 9,6 3,10" />
              </svg>
            </button>
            <span style={{
              fontFamily: 'var(--font-press-start)', fontSize: 4.5,
              color: showMenu || miniGame ? '#7C3AED' : '#2D1060', letterSpacing: 0.5,
            }}>
              {miniGame ? 'RIGHT' : pet.creatureId === 'egg' ? '···' : showMenu ? 'NEXT' : 'MENU'}
            </span>
          </div>
        </div>

        {/* Speaker dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              width: 3, height: 3, borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.5)',
            }} />
          ))}
        </div>
      </div>

      {/* ── Controls below device ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 290 }}>
        <button className="pixel-btn" onClick={toggleMute}>{muted ? 'UNMUTE' : 'MUTE'}</button>
        {!isViewing && (
          <button className="pixel-btn" onClick={toggleAlerts}>
            {alertsEnabled ? 'ALERTS ✓' : 'ALERTS'}
          </button>
        )}
        {!isViewing && <button className="pixel-btn" onClick={handleShare}>SHARE</button>}
        {!isViewing && <button className="pixel-btn" onClick={handleCopyBookmark}>BOOKMARK</button>}
        <button className="pixel-btn" onClick={() => setShowDex(true)}>DEX</button>
        <button className="pixel-btn" onClick={() => setShowLeaderboard(true)}>TOP PETS</button>
        <button className="pixel-btn" onClick={() => setShowTutorial(true)}>HELP</button>
        {pet.dead && !isViewing && (
          <button className="pixel-btn pixel-btn--primary" onClick={startNewPet}>NEW PET</button>
        )}
        {!isViewing && (
          <button
            className={`pixel-btn${confirmReset ? ' pixel-btn--primary' : ''}`}
            onClick={handleReset}
          >
            {confirmReset ? 'SURE?' : 'RESET'}
          </button>
        )}
      </div>

      {/* Share feedback */}
      {shareMsg && (
        <p style={{ fontFamily: 'var(--font-vt323)', color: '#4ADE80', fontSize: 18 }}>
          {shareMsg}
        </p>
      )}

      {/* Modals */}
      {showDeath && pet.dead && (
        <DeathCertificate pet={pet} onClose={() => setShowDeath(false)} onNewPet={startNewPet} />
      )}
      {showLeaderboard && (
        <Leaderboard pet={pet} onClose={() => setShowLeaderboard(false)} />
      )}
      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} />
      )}
      {showDex && (
        <DexModal discovered={discovered} onClose={() => setShowDex(false)} />
      )}
    </div>
  );
}
