'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PetState, createNewPet, loadPet, savePet, applyOfflineTicks,
  doGameTick, tickAnimation, feedPet, playWithPet, cleanPoop,
  giveMedicine, disciplinePet, toggleLight, TICK_MS,
} from '@/lib/petState';
import { sounds, setMuted, getMuted } from '@/lib/sounds';
import { drawCanvas, CW, CH, AnimationType, AnimState, ANIM_FRAMES } from '@/lib/canvasRenderer';
import { buildShareUrl, buildBookmarkUrl, decodePetFromShare } from '@/lib/share';
import DeathCertificate from './DeathCertificate';
import Leaderboard from './Leaderboard';
import Tutorial from './Tutorial';
import ActionMenu, { ACTIONS, ACTION_DEFS, type Action } from './ActionMenu';
import StarterPicker from './StarterPicker';
import type { Lineage } from '@/lib/petState';


export default function Device() {
  const [pet, setPet] = useState<PetState | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedAction, setSelectedAction] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [showDeath, setShowDeath] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [attention, setAttention] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showStarter, setShowStarter] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petRef = useRef<PetState | null>(null);
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeAnimRef = useRef<{ type: AnimationType; startFrame: number } | null>(null);
  const rafFrameRef = useRef(0);

  // ── Load pet ──────────────────────────────────────────────────────────────
  useEffect(() => {
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
          if (!getMuted()) sounds.evolve();
          triggerAnim('evolve');
        }

        if (n.dead && !s.dead) {
          if (!getMuted()) sounds.death();
          setShowDeath(true);
          // Submit to leaderboard
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
            }),
          }).catch(() => {});
        }

        const needsAttention =
          n.hunger <= 1 || n.happiness <= 1 || n.sick || n.poopCount >= 2;
        if (needsAttention && !n.sleeping) {
          setAttention(true);
          if (!getMuted()) sounds.attention();
        } else {
          setAttention(false);
        }

        return n;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isViewing]);

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

  const triggerAnim = useCallback((type: AnimationType) => {
    activeAnimRef.current = { type, startFrame: rafFrameRef.current };
  }, []);

  // ── Menu auto-close ───────────────────────────────────────────────────────
  const resetMenuTimer = useCallback(() => {
    clearTimeout(menuTimerRef.current);
    menuTimerRef.current = setTimeout(() => setShowMenu(false), 5000);
  }, []);

  // ── Button handlers ───────────────────────────────────────────────────────
  const pressLeft = () => {
    if (pet?.creatureId === 'egg') return;
    if (showStatus) { setShowStatus(false); return; }
    if (!showMenu) { setShowMenu(true); resetMenuTimer(); return; }
    setSelectedAction(i => (i - 1 + ACTIONS.length) % ACTIONS.length);
    resetMenuTimer();
    if (!getMuted()) sounds.beep();
  };

  const pressMiddle = () => {
    if (!pet || pet.dead || isViewing) return;
    if (pet.creatureId === 'egg') return;
    if (showStatus) { setShowStatus(false); return; }
    if (!showMenu) { setShowMenu(true); resetMenuTimer(); return; }
    const action = ACTIONS[selectedAction] as Action;

    if (action === 'status') { setShowStatus(s => !s); setShowMenu(false); return; }

    setPet(s => {
      if (!s) return s;
      let n = s;
      switch (action) {
        case 'food':
          n = feedPet(s);
          if (!getMuted()) sounds.feed();
          triggerAnim('feed');
          break;
        case 'light':
          n = toggleLight(s);
          if (!getMuted()) (n.sleeping ? sounds.sleep : sounds.wake)();
          triggerAnim(n.sleeping ? 'sleep' : 'wake');
          break;
        case 'play':
          n = playWithPet(s);
          if (!getMuted()) sounds.play();
          triggerAnim('play');
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
          if (!getMuted()) sounds.discipline();
          triggerAnim('discipline');
          break;
        case 'attention':
          if (!getMuted()) sounds.happy();
          triggerAnim('attention');
          setAttention(false);
          break;
      }
      savePet(n);
      petRef.current = n;
      return n;
    });
    setShowMenu(false);
  };

  const pressRight = () => {
    if (pet?.creatureId === 'egg') return;
    if (showStatus) { setShowStatus(false); return; }
    if (!showMenu) { setShowMenu(true); resetMenuTimer(); return; }
    setSelectedAction(i => (i + 1) % ACTIONS.length);
    resetMenuTimer();
    if (!getMuted()) sounds.beep();
  };

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

  const startNewPet = () => {
    setShowDeath(false);
    setShowStarter(true);
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); return; }
    localStorage.removeItem('bitling_pet_v1');
    setPet(null);
    petRef.current = null;
    setShowDeath(false);
    setShowStarter(true);
    setConfirmReset(false);
  };

  const handleStarterSelect = (lineage: Lineage, name: string) => {
    const n = createNewPet(name, lineage);
    savePet(n);
    setPet(n);
    petRef.current = n;
    setShowStarter(false);
    const u = new URL(window.location.href);
    u.searchParams.set('pet', n.id);
    window.history.replaceState({}, '', u.toString());
  };

  if (showStarter) {
    return <StarterPicker onCreate={handleStarterSelect} />;
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
      <h1 style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 22,
        color: '#A78BFA',
        textShadow: '0 0 12px #7C3AED, 0 0 24px #7C3AED',
        letterSpacing: 6,
        marginBottom: -4,
      }}>
        BITLING
      </h1>
      {isViewing && (
        <p style={{ fontFamily: 'var(--font-vt323)', color: '#6D28D9', fontSize: 16 }}>
          👁 Viewing {pet.name}'s pet
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
            visible={showMenu}
            selected={selectedAction}
            onSelect={setSelectedAction}
            onExecute={(i) => {
              if (!pet || pet.dead || isViewing) return;
              const action = ACTIONS[i] as Action;
              if (action === 'status') { setShowStatus(s => !s); setShowMenu(false); return; }
              setPet(s => {
                if (!s) return s;
                let n = s;
                switch (action) {
                  case 'food':
                    n = feedPet(s);
                    if (!getMuted()) sounds.feed();
                    triggerAnim('feed');
                    break;
                  case 'light':
                    n = toggleLight(s);
                    if (!getMuted()) (n.sleeping ? sounds.sleep : sounds.wake)();
                    triggerAnim(n.sleeping ? 'sleep' : 'wake');
                    break;
                  case 'play':
                    n = playWithPet(s);
                    if (!getMuted()) sounds.play();
                    triggerAnim('play');
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
                    if (!getMuted()) sounds.discipline();
                    triggerAnim('discipline');
                    break;
                  case 'attention':
                    if (!getMuted()) sounds.happy();
                    triggerAnim('attention');
                    setAttention(false);
                    break;
                }
                savePet(n);
                petRef.current = n;
                return n;
              });
              setShowMenu(false);
            }}
          />

          {/* Status overlay (shows on STATUS action) */}
          {showStatus && (
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
              <div>AGE : {ageH > 48 ? `${Math.floor(ageH/24)}D ${ageH%24}H` : `${ageH}H`}</div>
              <div>WT  : {pet.weight}G</div>
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
              color: showMenu ? '#7C3AED' : '#2D1060', letterSpacing: 0.5,
            }}>
              {pet.creatureId === 'egg' ? '···' : showMenu ? 'PREV' : 'MENU'}
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
              color: showMenu ? '#EC4899' : '#2D1060', letterSpacing: 0.5,
            }}>
              {pet.creatureId === 'egg' ? 'WAIT' : showMenu
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
              color: showMenu ? '#7C3AED' : '#2D1060', letterSpacing: 0.5,
            }}>
              {pet.creatureId === 'egg' ? '···' : showMenu ? 'NEXT' : 'MENU'}
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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280 }}>
        <PixelBtn onClick={toggleMute}>{muted ? 'UNMUTE' : 'MUTE'}</PixelBtn>
        {!isViewing && <PixelBtn onClick={handleShare}>SHARE PET</PixelBtn>}
        {!isViewing && <PixelBtn onClick={handleCopyBookmark}>BOOKMARK</PixelBtn>}
        <PixelBtn onClick={() => setShowLeaderboard(true)}>TOP PETS</PixelBtn>
        <PixelBtn onClick={() => setShowTutorial(true)}>HELP</PixelBtn>
        {pet.dead && !isViewing && (
          <PixelBtn onClick={startNewPet} highlight>NEW PET</PixelBtn>
        )}
        {!isViewing && (
          <PixelBtn onClick={handleReset} highlight={confirmReset}>
            {confirmReset ? 'SURE?' : 'RESET'}
          </PixelBtn>
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
    </div>
  );
}

// ─── Tiny pixel button component ─────────────────────────────────────────────

function PixelBtn({
  children, onClick, highlight = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 6,
        padding: '5px 8px',
        background: highlight ? '#4C1D95' : '#1A0A30',
        color: highlight ? '#EDE9FE' : '#7C3AED',
        border: `1px solid ${highlight ? '#7C3AED' : '#4C1D95'}`,
        borderRadius: 4,
        cursor: 'pointer',
        letterSpacing: 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#2D1060')}
      onMouseLeave={e => (e.currentTarget.style.background = highlight ? '#4C1D95' : '#1A0A30')}
    >
      {children}
    </button>
  );
}
