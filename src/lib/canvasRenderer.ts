import { CREATURES, CreatureData, LINEAGE_EGG_FRAMES, LINEAGE_EGG_PALETTES } from './creatures';
import { isNight } from './petState';
import type { PetState } from './petState';
import { getAchievements } from './achievements';

export const CW = 64;
export const CH = 56;

// ─── Animation types ──────────────────────────────────────────────────────────

export type AnimationType =
  | 'feed' | 'play' | 'clean' | 'medicine'
  | 'discipline' | 'sleep' | 'wake' | 'attention' | 'evolve' | 'refuse';

export interface AnimState {
  type: AnimationType;
  frame: number; // 0-based at ~30 fps
}

export const ANIM_FRAMES: Record<AnimationType, number> = {
  feed:       52,
  play:       66,
  clean:      40,
  medicine:   36,
  discipline: 34,
  sleep:      30,
  wake:       26,
  attention:  50,
  evolve:     72,
  refuse:     18,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function easeOut(t: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 2);
}
function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  if (x < 0 || x >= CW || y < 0 || y >= CH) return;
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ─── Reusable mini-sprites ────────────────────────────────────────────────────

// Hunger icon: tiny drumstick (4×5)
function drawDrumstickIcon(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean) {
  const M = filled ? '#FF8C42' : '#1A2A1A';
  const B = filled ? '#C8B890' : '#1A2A1A';
  // meat cap
  px(ctx, x+1, y,   M); px(ctx, x+2, y,   M);
  px(ctx, x,   y+1, M); px(ctx, x+1, y+1, M); px(ctx, x+2, y+1, M);
  px(ctx, x+1, y+2, M); px(ctx, x+2, y+2, M);
  // bone
  px(ctx, x+2, y+3, B);
  px(ctx, x+2, y+4, B); px(ctx, x+3, y+4, B);
}

// Happiness icon: 5×5 filled face — circle outline, two eyes, U-shaped smile
function drawSmileyIcon(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean) {
  const F = filled ? '#FFD700' : '#1A2A1A'; // face fill
  const D = filled ? '#2D2D2D' : '#1A2A1A'; // eyes + mouth

  // Row 0: .FFF.  — top arc
  px(ctx, x+1, y,   F); px(ctx, x+2, y,   F); px(ctx, x+3, y,   F);
  // Row 1: Fe.eF  — eye row
  px(ctx, x,   y+1, F); px(ctx, x+1, y+1, D); px(ctx, x+3, y+1, D); px(ctx, x+4, y+1, F);
  // Row 2: F...F  — middle
  px(ctx, x,   y+2, F); px(ctx, x+4, y+2, F);
  // Row 3: Fm.mF  — smile corners
  px(ctx, x,   y+3, F); px(ctx, x+1, y+3, D); px(ctx, x+3, y+3, D); px(ctx, x+4, y+3, F);
  // Row 4: .FmF.  — smile bottom arc
  px(ctx, x+1, y+4, F); px(ctx, x+2, y+4, D); px(ctx, x+3, y+4, F);
}

function drawPoop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const rows = ['.BB.', 'BBBB', '.BB.', 'BBBB'];
  rows.forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === 'B') { ctx.fillStyle = r === 0 ? '#9B5E3A' : '#6B3A1F'; ctx.fillRect(x + col, y + r, 1, 1); }
  }));
}

const Z_GLYPH = ['ZZZZZ', '...ZZ', '.ZZ..', 'ZZ...', 'ZZZZZ'];
function drawZ(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.fillStyle = '#A78BFA';
  Z_GLYPH.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === 'Z') ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
  }));
}

function drawSkull(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ['.SS.', 'SSSS', 'S..S', '.SS.'].forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === 'S') { ctx.fillStyle = '#9CA3AF'; ctx.fillRect(x + col, y + r, 1, 1); }
  }));
}

function drawSick(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // 5×4 mini skull for status bar
  const S = '#F87171';
  ['.SSS.', 'S.S.S', 'SSSSS', '.S.S.'].forEach((row, r) =>
    [...row].forEach((ch, c) => { if (ch === 'S') px(ctx, x - 2 + c, y + r, S); })
  );
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  palette: Record<string, string>,
  ox: number, oy: number,
) {
  for (let r = 0; r < frame.length; r++) {
    for (let c = 0; c < frame[r].length; c++) {
      const ch = frame[r][c];
      if (ch === '.') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + c, oy + r, 1, 1);
    }
  }
}

// ─── Individual animations ────────────────────────────────────────────────────
// Overlay effects drawn on top of the pet.  animSpriteOffset() (further down)
// nudges the pet sprite itself in sync with these so actions read as physical
// instead of happening next to a statue.

const FEED_CHOMPS = [13, 27, 39];

// FEED: drumstick arcs in from the top-right — 3 bites, crumbs fly each time
function animFeed(ctx: CanvasRenderingContext2D, frame: number) {
  const fx = 42, fy = 20; // food anchor (right of pet)
  let x = fx, y = fy;
  if (frame < 8) {
    const t = easeOut(frame / 8);
    x = Math.round(lerp(60, fx, t));
    y = Math.round(lerp(8, fy, t) - Math.sin(Math.PI * t) * 5); // arc in
  }

  // Bite stage: 0 = full, 1 = half eaten, 2 = bone only, 3 = gone
  const stage = frame < 16 ? 0 : frame < 30 ? 1 : frame < 42 ? 2 : 3;

  // Chomp flash on each bite transition
  if (FEED_CHOMPS.some(c => frame >= c && frame < c + 3)) {
    rect(ctx, x - 3, y + 3, 5, 2, '#FFFFC0');
  }

  // Crumbs spray from the bite point for a few frames after each chomp
  FEED_CHOMPS.forEach(c => {
    const cf = frame - c;
    if (cf >= 1 && cf < 6) {
      px(ctx, x - 4 - cf,     y + 2 + cf,                    '#FFB870');
      px(ctx, x - 3 - cf * 2, y + 4 + Math.round(cf * 0.5),  '#C96A1E');
      px(ctx, x - 2 - cf,     y + 6 + cf,                    '#FF8C42');
    }
  });

  const M = '#FF8C42', Md = '#C96A1E', B = '#D4C5A0';

  if (stage === 3) {
    // Bone arcs off to the right
    const bf = frame - 42;
    if (bf < 4) {
      px(ctx, x + 1 + bf * 2, y + 5 - bf, B);
      px(ctx, x + 2 + bf * 2, y + 6 - bf, B);
    }
    // satisfied sparkle by the pet's mouth
    if (frame >= 46 && frame % 4 < 2) {
      px(ctx, 38, 24, '#FFFFFF'); px(ctx, 37, 23, '#FFE8A0'); px(ctx, 39, 25, '#FFE8A0');
    }
    return;
  }

  if (stage === 0) {
    // Full drumstick — big round meat cap + short bone
    px(ctx, x+1, y,   M); px(ctx, x+2, y,   M);  px(ctx, x+3, y,   M);
    px(ctx, x,   y+1, M); px(ctx, x+1, y+1, Md); px(ctx, x+2, y+1, Md); px(ctx, x+3, y+1, Md); px(ctx, x+4, y+1, M);
    px(ctx, x,   y+2, M); px(ctx, x+1, y+2, M);  px(ctx, x+2, y+2, Md); px(ctx, x+3, y+2, M);  px(ctx, x+4, y+2, M);
    px(ctx, x+1, y+3, M); px(ctx, x+2, y+3, M);  px(ctx, x+3, y+3, M);
    px(ctx, x+2, y+4, B);
    px(ctx, x+2, y+5, B); px(ctx, x+3, y+5, B);
  }

  if (stage === 1) {
    // First bite taken — top row of meat gone, cap shrinking
    px(ctx, x+1, y+1, M);  px(ctx, x+2, y+1, Md); px(ctx, x+3, y+1, M);
    px(ctx, x+1, y+2, M);  px(ctx, x+2, y+2, M);
    px(ctx, x+2, y+3, M);
    px(ctx, x+2, y+4, B);
    px(ctx, x+2, y+5, B);  px(ctx, x+3, y+5, B);
  }

  if (stage === 2) {
    // Second bite — just a scrap of meat left on the bone
    px(ctx, x+2, y+3, M);
    px(ctx, x+2, y+4, B);
    px(ctx, x+2, y+5, B);  px(ctx, x+3, y+5, B);
  }
}

// ── Play variant chosen randomly each press ───────────────────────────────
let _playVariant = 0;

// PLAY VARIANT 0: rubber ball bounce — drops, bounces near pet, rolls away
function animPlayBall(ctx: CanvasRenderingContext2D, frame: number) {
  const GY = 43;
  const KP: [number, number, number][] = [
    [ 0, 38,  3],
    [ 9, 38, GY],   // bounce 1
    [15, 29, 18],   // arc toward pet
    [21, 27, GY],   // bounce 2 at pet's feet
    [28, 33, 11],   // high arc
    [35, 38, GY],   // bounce 3
    [42, 40, GY-4],
    [46, 38, GY],   // settle
    [55, 62, GY],   // roll off right
    [66, 70, GY],
  ];
  let bx = 38, by = 3;
  for (let i = 0; i < KP.length - 1; i++) {
    const [f0, x0, y0] = KP[i], [f1, x1, y1] = KP[i + 1];
    if (frame >= f0 && frame < f1) {
      const t = (frame - f0) / (f1 - f0);
      bx = x0 + (x1 - x0) * t;
      by = y0 + (y1 - y0) * (y1 > y0 ? t * t : 1 - (1 - t) * (1 - t));
      break;
    }
  }
  const ix = Math.round(bx), iy = Math.round(by);
  const onBounce = [9, 21, 35, 46].some(f => Math.abs(frame - f) <= 1);

  // ground shadow — larger when close to ground
  const sw = Math.max(1, Math.round(6 - (GY - iy) * 0.08));
  ctx.fillStyle = '#000000';
  ctx.fillRect(ix - Math.round(sw / 2) + 1, GY + 2, sw, 1);

  // impact sparks
  if (onBounce) {
    px(ctx, ix - 2, iy - 1, '#FFFFA0'); px(ctx, ix + 5, iy - 1, '#FFFFA0');
    px(ctx, ix + 1, iy - 3, '#FFFF60');
  }

  // ball — squished oval on bounce, round sphere in air
  const O = '#FF5555', Ob = '#CC2222', W = '#FFAAAA';
  if (onBounce) {
    rect(ctx, ix - 1, iy,   6, 1, O);
    rect(ctx, ix,     iy+1, 5, 1, Ob);
  } else if (ix < 63) {
    px(ctx, ix+1, iy,   O);  px(ctx, ix+2, iy,   O);
    px(ctx, ix,   iy+1, O);  px(ctx, ix+1, iy+1, W);  px(ctx, ix+2, iy+1, O); px(ctx, ix+3, iy+1, O);
    px(ctx, ix,   iy+2, Ob); px(ctx, ix+1, iy+2, O);  px(ctx, ix+2, iy+2, O); px(ctx, ix+3, iy+2, Ob);
    px(ctx, ix+1, iy+3, Ob); px(ctx, ix+2, iy+3, Ob);
  }

  // excitement sparkles while ball is near pet (frames 14–28)
  if (frame >= 14 && frame <= 28) {
    const t = (frame - 14) / 14;
    const sy = Math.round(lerp(25, 11, easeOut(t)));
    px(ctx, 22, sy,     '#FFD700');
    px(ctx, 20, sy + 2, '#FF69B4');
    px(ctx, 24, sy - 1, '#FFD700');
  }
}

// PLAY VARIANT 1: handheld video game
function animPlayGamepad(ctx: CanvasRenderingContext2D, frame: number) {
  const SLIDE = 12;
  const gx = frame < SLIDE ? Math.round(lerp(64, 34, easeOut(frame / SLIDE))) : 34;
  const gy = 22;
  const BD = '#374151', BDK = '#1F2937', SCRB = '#14532D';
  const BA = '#EF4444', BB = '#3B82F6';

  // console body (12×10)
  rect(ctx, gx+1, gy,   10, 1, BDK);
  rect(ctx, gx,   gy+1, 12, 8, BD);
  rect(ctx, gx+1, gy+9, 10, 1, BDK);
  // screen bezel
  rect(ctx, gx+2, gy+1, 6, 5, SCRB);
  // flickering screen content
  rect(ctx, gx+3, gy+2, 4, 3, '#0A1A0A');
  const fc = Math.floor(frame / 2) % 4;
  rect(ctx, gx+3, gy+2, 2, 1, fc % 2 === 0 ? '#4ADE80' : '#22C55E');
  rect(ctx, gx+5, gy+3, 1, 2, fc % 2 !== 0 ? '#4ADE80' : '#22C55E');
  rect(ctx, gx+3, gy+4, 3, 1, fc % 2 === 0 ? '#4ADE80' : '#22C55E');
  // d-pad
  px(ctx, gx+1, gy+4, BDK); px(ctx, gx+1, gy+5, BDK); px(ctx, gx+1, gy+6, BDK);
  // buttons
  px(ctx, gx+10, gy+4, BA); px(ctx, gx+11, gy+5, BB);

  // rapid button-mash sparks
  if (frame > SLIDE && frame < 56) {
    if (Math.floor(frame / 3) % 2 === 0) {
      px(ctx, gx+12, gy+3, '#FFFFA0'); px(ctx, gx+10, gy+3, '#FFFFFF');
    }
    if (Math.floor(frame / 4) % 2 === 0) px(ctx, gx+1, gy+3, '#60A5FA');
  }

  // !! reaction bubble above pet (frames 22–52)
  if (frame >= 22 && frame < 52) {
    const show = (frame - 22) > 4;
    if (show) {
      // two exclamation marks
      px(ctx, 29, 10, '#FFF'); px(ctx, 29, 11, '#FFF'); px(ctx, 29, 12, '#FFF'); px(ctx, 29, 14, '#FFF');
      px(ctx, 32, 10, '#FFF'); px(ctx, 32, 11, '#FFF'); px(ctx, 32, 12, '#FFF'); px(ctx, 32, 14, '#FFF');
      // bubble tail
      px(ctx, 29, 16, '#4B5563'); px(ctx, 28, 17, '#4B5563');
    }
  }
}

// PLAY VARIANT 2: guitar / instrument
function animPlayGuitar(ctx: CanvasRenderingContext2D, frame: number) {
  const SLIDE = 10;
  const gx = frame < SLIDE ? Math.round(lerp(-12, 16, easeOut(frame / SLIDE))) : 16;
  const gy = 20;
  const WD = '#92400E', WDK = '#78350F', STR = '#D4AF37', HOLE = '#1C0A00';

  // guitar body (10×10)
  rect(ctx, gx+1, gy,   8, 1, WD);
  rect(ctx, gx,   gy+1, 10, 8, WD);
  rect(ctx, gx+1, gy+9, 8, 1, WD);
  px(ctx, gx,    gy+2, WDK); px(ctx, gx+9, gy+2, WDK);
  px(ctx, gx,    gy+7, WDK); px(ctx, gx+9, gy+7, WDK);
  // sound hole
  px(ctx, gx+4, gy+3, HOLE); px(ctx, gx+5, gy+3, HOLE);
  px(ctx, gx+3, gy+4, HOLE); px(ctx, gx+4, gy+4, HOLE); px(ctx, gx+5, gy+4, HOLE); px(ctx, gx+6, gy+4, HOLE);
  px(ctx, gx+4, gy+5, HOLE); px(ctx, gx+5, gy+5, HOLE);
  // neck (going up)
  rect(ctx, gx+4, gy-7, 2, 8, WDK);
  // tuning pegs
  px(ctx, gx+3, gy-7, STR); px(ctx, gx+6, gy-6, STR); px(ctx, gx+3, gy-5, STR);

  // strings with strum animation
  if (frame > SLIDE) {
    const sc = Math.floor((frame - SLIDE) / 5) % 3;
    for (let s = 0; s < 3; s++) {
      const sy = gy + 2 + s * 2;
      const strumming = sc === s;
      ctx.fillStyle = strumming ? '#FFE066' : STR;
      ctx.fillRect(gx+1, sy, 8, 1);
      if (strumming) {
        px(ctx, gx+2, sy-1, '#FFE066'); px(ctx, gx+5, sy+1, '#FFE066'); px(ctx, gx+8, sy-1, '#FFE066');
      }
    }
  }

  // musical notes float up (staggered, 3 notes)
  const NC = ['#A78BFA', '#7C3AED', '#C084FC'];
  [[12, 0], [22, 3], [33, -2]].forEach(([start, dx], i) => {
    if (frame > start && frame < start + 44) {
      const t = (frame - start) / 44;
      const nx = gx + 11 + dx;
      const ny = Math.round(lerp(gy + 4, gy - 18, easeOut(t)));
      if (nx >= 0 && nx < CW && ny >= 0) {
        rect(ctx, nx,   ny,     1, 3, NC[i]);
        rect(ctx, nx-1, ny + 3, 2, 1, NC[i]);
      }
    }
  });
}

// PLAY dispatcher — randomly picks a variant each press
function animPlay(ctx: CanvasRenderingContext2D, frame: number) {
  if (frame === 0) _playVariant = Math.floor(Math.random() * 3);
  if (_playVariant === 0) animPlayBall(ctx, frame);
  else if (_playVariant === 1) animPlayGamepad(ctx, frame);
  else animPlayGuitar(ctx, frame);
}

// CLEAN: a broom sweeps across the poop zone, sparkles bloom behind it
function animClean(ctx: CanvasRenderingContext2D, frame: number) {
  // Broom sweeps left → right over the poop area (frames 0–21)
  if (frame < 22) {
    const bx = Math.round(lerp(40, 62, frame / 22));
    const by = 43 + (frame % 4 < 2 ? 0 : 1); // scrubbing bob
    // handle
    rect(ctx, bx + 2, by - 11, 1, 8, '#A06A3A');
    px(ctx, bx + 2, by - 12, '#C08A50');
    // bristle head — wide fan so it reads as a broom
    rect(ctx, bx,     by - 3, 5, 1, '#D4B06A');
    rect(ctx, bx - 1, by - 2, 7, 2, '#C09A50');
    for (let i = 0; i < 7; i++) {
      px(ctx, bx - 1 + i, by, i % 2 === 0 ? '#B08840' : '#C09A50');
    }
    // dust kicked up behind the broom
    if (frame > 2) {
      px(ctx, bx - 4, by - 3 - (frame % 3), '#8AA890');
      px(ctx, bx - 6, by - 5 + (frame % 2), '#6E8E78');
    }
  }

  // Sparkles bloom where the poop was, once the broom has passed
  const SPARKS = [
    { dx:  0,   dy: -1,   c: '#4ADE80' },
    { dx: -1,   dy: -0.8, c: '#34D399' },
    { dx:  1,   dy: -0.9, c: '#6EE7B7' },
    { dx:  0.6, dy: -1.2, c: '#A7F3D0' },
    { dx: -0.7, dy: -1,   c: '#4ADE80' },
    { dx:  1.2, dy: -0.6, c: '#34D399' },
  ];
  if (frame >= 14 && frame < 38) {
    const s = (frame - 14) * 0.45;
    SPARKS.forEach(({ dx, dy, c }) => {
      const sx = 51 + dx * s;
      const sy = 47 + dy * s;
      px(ctx, sx,     sy,     c);
      px(ctx, sx - 1, sy,     c);
      px(ctx, sx + 1, sy,     c);
      px(ctx, sx,     sy - 1, c);
    });
    // white twinkles
    if (frame % 6 < 2) {
      px(ctx, 49, 44, '#FFFFFF');
    } else if (frame % 6 < 4) {
      px(ctx, 55, 47, '#FFFFFF');
    }
  }
}

// MEDICINE: a capsule drops in and is gulped, healing crosses pulse,
// then green recovery sparkles
function animMedicine(ctx: CanvasRenderingContext2D, frame: number) {
  const cx = 30, cy = 24;

  // Capsule falls from above (frames 0–9): red half + white half
  if (frame < 10) {
    const py = Math.round(lerp(2, 20, easeOut(frame / 10)));
    rect(ctx, cx - 1, py, 2, 2, '#F87171');
    rect(ctx, cx + 1, py, 2, 2, '#FDF2F8');
  }

  // Gulp flash when it lands
  if (frame >= 10 && frame < 13) rect(ctx, cx - 2, 22, 5, 2, '#FFE4F0');

  // Pulsing cross (frames 12–29), size 1→3→1
  if (frame >= 12 && frame < 30) {
    const pulse = Math.sin(Math.PI * (frame - 12) / 9);
    const size = Math.round(1 + Math.abs(pulse) * 2);

    rect(ctx, cx,        cy - size, 1, size * 2 + 1, '#F9A8D4'); // vertical
    rect(ctx, cx - size, cy,        size * 2 + 1, 1, '#F9A8D4'); // horizontal
    px(ctx, cx, cy, '#FFFFFF'); // bright center so it reads on any body color

    // Tip highlights
    if (size >= 2) {
      px(ctx, cx,            cy - size - 1, '#FBCFE8');
      px(ctx, cx,            cy + size,     '#FBCFE8');
      px(ctx, cx - size - 1, cy,            '#FBCFE8');
      px(ctx, cx + size,     cy,            '#FBCFE8');
    }

    // Second small cross, slightly right
    if (frame >= 18) {
      rect(ctx, 38, 19, 1, 3, '#F9A8D4');
      rect(ctx, 37, 20, 3, 1, '#F9A8D4');
    }
  }

  // Recovery sparkles (frames 28+)
  if (frame >= 28) {
    const c = frame % 4 < 2 ? '#86EFAC' : '#4ADE80';
    px(ctx, 24, 18, c); px(ctx, 40, 20, c); px(ctx, 32, 12, c);
    px(ctx, 26, 14, frame % 4 < 2 ? '#FFFFFF' : '#86EFAC');
  }
}

// DISCIPLINE: exclamation + anger vein flash, the pet flinches and sweats,
// then a star burst lands the lesson
function animDiscipline(ctx: CanvasRenderingContext2D, frame: number) {
  // Blinking ! in top-right area
  if (frame < 20) {
    const blink = Math.floor(frame / 5) % 2 === 0;
    const c = blink ? '#FCD34D' : '#F59E0B';
    rect(ctx, 44, 9, 2, 4, c);  // body
    rect(ctx, 44, 15, 2, 1, c); // dot
  }

  // Anger vein mark near the pet's head (frames 4–21)
  if (frame >= 4 && frame < 22) {
    const A = '#F87171';
    px(ctx, 22, 14, A); px(ctx, 24, 14, A);
    px(ctx, 23, 15, A);
    px(ctx, 22, 16, A); px(ctx, 24, 16, A);
  }

  // Sweat drop sliding down the pet's side (frames 8–25)
  if (frame >= 8 && frame < 26) {
    const sy = 18 + Math.round((frame - 8) * 0.5);
    px(ctx, 40, sy,     '#93C5FD');
    px(ctx, 40, sy + 1, '#60A5FA');
  }

  // Star-burst above pet head (frame 16+)
  if (frame >= 16) {
    const sf = frame - 16;
    const maxR = Math.min(sf * 0.8, 6);
    for (let i = 1; i < maxR; i++) {
      px(ctx, 32,     12 - i, '#FCD34D'); // up
      px(ctx, 32,     12 + i, '#FCD34D'); // down
      px(ctx, 32 - i, 12,     '#FCD34D'); // left
      px(ctx, 32 + i, 12,     '#FCD34D'); // right
    }
    if (sf < 8) {
      px(ctx, 32, 12, '#FFFFFF'); // bright center
    }
  }
}

// SLEEP: moon appears + staggered ZZZs rise
function animSleep(ctx: CanvasRenderingContext2D, frame: number) {
  // Crescent moon top-right
  if (frame > 6) {
    const MOON = ['.MMM.', 'MM...', 'M....', 'MM...', '.MMM.'];
    const alpha = Math.min(1, (frame - 6) / 10);
    ctx.globalAlpha = alpha;
    MOON.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === 'M') px(ctx, 52 + c, 4 + r, '#FDE68A');
    }));
    ctx.globalAlpha = 1;
  }

  // Stars twinkle in around the moon
  if (frame > 10) {
    if (frame % 8 < 4) px(ctx, 46, 6, '#FDE68A');
    else px(ctx, 49, 11, '#FDE68A');
    if (frame % 6 < 3) px(ctx, 44, 13, '#FBBF24');
  }

  // Staggered ZZZ bubbles rising from pet
  [[0, 42, 18], [8, 46, 16], [16, 44, 19]].forEach(([start, zx, baseY]) => {
    if (frame <= start) return;
    const f = frame - start;
    const zy = Math.round(lerp(baseY, baseY - 12, Math.min(1, f / 16)));
    if (f < 20) drawZ(ctx, zx, zy);
  });
}

// WAKE: white flash, rays shoot outward, the pet springs up, sun rises
function animWake(ctx: CanvasRenderingContext2D, frame: number) {
  if (frame < 5) {
    // White flash — fill entire screen
    ctx.fillStyle = '#FFFFDD';
    ctx.fillRect(0, 0, CW, CH);
    return;
  }

  const sf = frame - 5;
  const maxLen = Math.min(sf * 1.8, 16);
  const DIRS = [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];

  DIRS.forEach(([dx, dy]) => {
    for (let i = 3; i < maxLen; i++) {
      const bright = i < 6;
      px(ctx, 32 + dx * i, 26 + dy * i, bright ? '#FDE68A' : '#FBBF2455');
    }
  });

  if (sf < 10) {
    rect(ctx, 31, 25, 3, 3, '#FFFFFF'); // bright center
  }

  // Little sun where the moon was, with blinking rays
  if (sf > 4) {
    rect(ctx, 52, 5, 3, 3, '#FDE68A');
    px(ctx, 53, 6, '#FFFBD0');
    if (sf % 4 < 2) {
      px(ctx, 53, 3, '#FBBF24'); px(ctx, 53, 9, '#FBBF24');
      px(ctx, 50, 6, '#FBBF24'); px(ctx, 56, 6, '#FBBF24');
    } else {
      px(ctx, 51, 4, '#FBBF24'); px(ctx, 55, 4, '#FBBF24');
      px(ctx, 51, 8, '#FBBF24'); px(ctx, 55, 8, '#FBBF24');
    }
  }
}

// ATTENTION: hearts float up, staggered
const HEART_PX = [[0,1],[0,2],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,1],[3,2],[4,2]] as [number,number][];
function drawFloatHeart(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  HEART_PX.forEach(([r, col]) => px(ctx, x + col, y + r, c));
}

function animAttention(ctx: CanvasRenderingContext2D, frame: number) {
  const HEARTS = [
    { start: 0,  sx: 27, c: '#FF4466' },
    { start: 12, sx: 35, c: '#FF6B88' },
    { start: 24, sx: 29, c: '#FF4466' },
  ];
  HEARTS.forEach(({ start, sx, c }) => {
    if (frame < start || frame > start + 38) return;
    const f = frame - start;
    const hy = Math.round(lerp(26, 5, easeOut(Math.min(1, f / 30))));
    if (f < 34) drawFloatHeart(ctx, sx, hy, c);
  });
}

// EVOLVE: triple white flash, then the new form drops in with expanding
// rings, radiating sparks, and falling confetti
function animEvolve(ctx: CanvasRenderingContext2D, frame: number) {
  const FLASHES = [[0,7],[12,19],[26,33]] as [number,number][];
  const isFlash = FLASHES.some(([s, e]) => frame >= s && frame < e);

  if (isFlash) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CW, CH);
    return;
  }

  if (frame >= 33) {
    const sf = frame - 33;

    // Two expanding diamond rings, staggered
    const RINGS: [number, string][] = [[0, '#A78BFA'], [8, '#7C3AED']];
    RINGS.forEach(([delay, c]) => {
      const r = Math.round((sf - delay) * 1.1);
      if (r > 2 && r < 26) {
        for (let i = 0; i <= r; i++) {
          px(ctx, 32 + i, 26 - (r - i), c);
          px(ctx, 32 - i, 26 - (r - i), c);
          px(ctx, 32 + i, 26 + (r - i), c);
          px(ctx, 32 - i, 26 + (r - i), c);
        }
      }
    });

    const SPARKS = [
      { ox: 24, oy: 18, dx: -1, dy: -1, c: '#A78BFA' },
      { ox: 40, oy: 18, dx:  1, dy: -1, c: '#7C3AED' },
      { ox: 24, oy: 34, dx: -1, dy:  1, c: '#C4B5FD' },
      { ox: 40, oy: 34, dx:  1, dy:  1, c: '#A78BFA' },
      { ox: 32, oy: 14, dx:  0, dy: -1, c: '#EDE9FE' },
      { ox: 32, oy: 38, dx:  0, dy:  1, c: '#7C3AED' },
      { ox: 20, oy: 26, dx: -1, dy:  0, c: '#A78BFA' },
      { ox: 44, oy: 26, dx:  1, dy:  0, c: '#C4B5FD' },
    ];
    SPARKS.forEach(({ ox, oy, dx, dy, c }) => {
      const spx = ox + dx * sf * 0.55;
      const spy = oy + dy * sf * 0.55;
      px(ctx, spx, spy, c);
      if (sf % 4 < 2) {
        px(ctx, spx - 1, spy, c);
        px(ctx, spx + 1, spy, c);
        px(ctx, spx, spy - 1, c);
        px(ctx, spx, spy + 1, c);
      }
    });

    // Confetti drifting down
    const CONFETTI: [number, string][] = [
      [8, '#FCD34D'], [18, '#4ADE80'], [28, '#F472B6'],
      [38, '#60A5FA'], [48, '#FBBF24'], [56, '#A78BFA'],
    ];
    CONFETTI.forEach(([cx, c], i) => {
      const cy = 4 + ((sf * (2 + (i % 3)) >> 1) + i * 7) % 42;
      px(ctx, cx + (Math.floor((sf + i) / 4) % 2), cy, c);
    });
  }
}

// ─── Passive state effects (loop continuously based on pet condition) ─────────

function drawStateEffects(ctx: CanvasRenderingContext2D, pet: PetState) {
  const t = Math.floor(Date.now() / 50); // ~20 fps tick counter

  // ── HUNGRY: blinking speech bubble with a chicken leg ───────────────────
  if (pet.hunger <= 1) {
    const show = pet.hunger === 0 || Math.floor(t / 8) % 2 === 0;
    if (show) {
      const bc = pet.hunger === 0 ? '#FF6B6B' : '#FCA5A5';
      rect(ctx, 4, 9, 14, 8, '#0A1A0A');           // bubble bg
      ctx.fillStyle = bc;
      ctx.fillRect(5,  8, 12, 1);                  // top
      ctx.fillRect(5, 16, 12, 1);                  // bottom
      ctx.fillRect(4,  9,  1, 7);                  // left
      ctx.fillRect(17, 9,  1, 7);                  // right
      px(ctx, 18, 12, bc);                          // tail →
      px(ctx, 19, 13, bc);
      // Drumstick — big round meat cap, minimal bone
      //   .MMM.
      //   MMMMM
      //   MMMMM
      //   .MMM.
      //   ..B..
      const M = '#FF8C42', Md = '#C96A1E', B = '#D4C5A0';
      px(ctx,  8, 10, M); px(ctx,  9, 10, M);  px(ctx, 10, 10, M);           // top cap
      px(ctx,  7, 11, M); px(ctx,  8, 11, Md); px(ctx,  9, 11, Md); px(ctx, 10, 11, Md); px(ctx, 11, 11, M);
      px(ctx,  7, 12, M); px(ctx,  8, 12, M);  px(ctx,  9, 12, Md); px(ctx, 10, 12, M);  px(ctx, 11, 12, M);
      px(ctx,  8, 13, M); px(ctx,  9, 13, M);  px(ctx, 10, 13, M);           // bottom cap
      px(ctx,  9, 14, B); px(ctx, 10, 14, B);                                 // single bone row
    }
  }

  // ── UNHAPPY: teardrops falling from eye height ────────────────────────────
  if (pet.happiness <= 1) {
    const c = pet.happiness === 0 ? '#60A5FA' : '#93C5FD';
    const phase1 = t % 18;
    if (phase1 < 12) {
      const ty = 23 + Math.round(phase1 * 0.8);
      px(ctx, 27, ty, c);
      if (phase1 > 2) px(ctx, 27, ty - 1, c);
    }
    const phase2 = (t + 9) % 18;                 // right tear staggered
    if (phase2 < 12) {
      const ty = 23 + Math.round(phase2 * 0.8);
      px(ctx, 36, ty, c);
      if (phase2 > 2) px(ctx, 36, ty - 1, c);
    }
  }

  // ── SICK: skull bobbing above pet ────────────────────────────────────────
  if (pet.sick) {
    const bob = Math.round(Math.sin(t * 0.12) * 1.5);
    const sx = 28, sy = 8 + bob;
    const S = '#4ADE80';

    // 8×7 pixel skull matching reference
    [
      '..SSSS..',
      '.SSSSSS.',
      'SSSSSSSS',
      'S..SS..S',
      'S..SS..S',
      'SSSSSSSS',
      'S.SSSS.S',
    ].forEach((row, r) =>
      [...row].forEach((ch, c) => { if (ch === 'S') px(ctx, sx + c, sy + r, S); })
    );

    // drip below jaw
    const drip = t % 16;
    if (drip < 12) {
      const dy = sy + 7 + Math.round(drip * 0.5);
      px(ctx, sx + 3, dy,     S);
      px(ctx, sx + 4, dy + 1, S);
    }
  }

  // ── STINKY: wavy squiggles rising above poop piles ────────────────────────
  if (pet.poopCount >= 2) {
    for (let i = 0; i < Math.min(pet.poopCount, 3); i++) {
      const bx = 50 + i * 5;
      const offset = (t + i * 6) % 14;
      const rise = offset < 7 ? offset * 0.5 : (14 - offset) * 0.5;
      for (let j = 0; j < 4; j++) {
        const wy = Math.round(44 - j * 2 - rise);
        px(ctx, bx + (j % 2 === 0 ? 1 : -1), wy, '#6B3A1F');
      }
    }
  }

  // ── FALSE ALARM: blinking "!?" — the pet is calling for no reason ────────
  if (pet.falseAlarm) {
    if (Math.floor(t / 7) % 2 === 0) {
      const C = '#FCD34D';
      // "!"
      px(ctx, 42, 10, C); px(ctx, 42, 11, C); px(ctx, 42, 12, C); px(ctx, 42, 14, C);
      // "?"
      px(ctx, 45, 10, C); px(ctx, 46, 10, C);
      px(ctx, 47, 11, C);
      px(ctx, 46, 12, C);
      px(ctx, 46, 14, C);
    }
  }

  // ── CRITICAL: red vignette pulse when both stats are zero ─────────────────
  if (pet.hunger === 0 && pet.happiness === 0) {
    const pulse = (Math.sin(t * 0.25) + 1) / 2;
    ctx.fillStyle = `rgba(239,68,68,${(0.05 + pulse * 0.12).toFixed(2)})`;
    ctx.fillRect(0, 0, CW, CH);
  }
}

// Soft shadow under the sprite (feet sit on sprite row 14 → y 32)
function drawShadow(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#051204';
  ctx.fillRect(27, 33, 10, 1);
  ctx.fillRect(29, 34, 6, 1);
}

// REFUSE: a spoiled pet turns its nose up — red X blinks while it shakes
function animRefuse(ctx: CanvasRenderingContext2D, frame: number) {
  if (frame % 6 < 4) {
    const X = '#F87171';
    px(ctx, 41, 12, X); px(ctx, 45, 12, X);
    px(ctx, 42, 13, X); px(ctx, 44, 13, X);
    px(ctx, 43, 14, X);
    px(ctx, 42, 15, X); px(ctx, 44, 15, X);
    px(ctx, 41, 16, X); px(ctx, 45, 16, X);
  }
}

// How the pet sprite itself moves during each animation — hops, leans,
// flinches — so the action feels physical.  The drop shadow stays put,
// which makes vertical hops read correctly.
function animSpriteOffset(anim?: AnimState | null): { dx: number; dy: number } {
  if (!anim) return { dx: 0, dy: 0 };
  const { type, frame } = anim;
  switch (type) {
    case 'feed': {
      // lean toward the food, lunge on each chomp
      const chomp = FEED_CHOMPS.some(c => frame >= c && frame < c + 3);
      return { dx: chomp ? 2 : frame >= 8 && frame < 44 ? 1 : 0, dy: 0 };
    }
    case 'play': {
      if (_playVariant === 0) {
        // hop along with the ball bounces
        const hop = [10, 22, 36].find(h => frame >= h && frame < h + 6);
        if (hop === undefined) return { dx: 0, dy: 0 };
        const t = (frame - hop) / 5;
        return { dx: 0, dy: -Math.round(Math.sin(Math.PI * t) * 3) };
      }
      if (_playVariant === 1) {
        // jitter while mashing buttons
        return frame > 12 && frame < 56 ? { dx: Math.floor(frame / 3) % 2, dy: 0 } : { dx: 0, dy: 0 };
      }
      // sway with the strums
      return frame > 10 ? { dx: Math.floor(frame / 8) % 2 === 0 ? -1 : 1, dy: 0 } : { dx: 0, dy: 0 };
    }
    case 'medicine':
      // shiver until the medicine kicks in
      return frame < 13 ? { dx: frame % 2 === 0 ? -1 : 1, dy: 0 } : { dx: 0, dy: 0 };
    case 'discipline':
      // flinch away, head down
      return frame >= 4 && frame < 24 ? { dx: -1, dy: 1 } : { dx: 0, dy: 0 };
    case 'sleep':
      // settle down into bed
      return frame > 10 ? { dx: 0, dy: 1 } : { dx: 0, dy: 0 };
    case 'wake': {
      // spring up out of bed
      if (frame < 5 || frame >= 16) return { dx: 0, dy: 0 };
      const t = (frame - 5) / 11;
      return { dx: 0, dy: -Math.round(Math.sin(Math.PI * t) * 4) };
    }
    case 'attention':
      // excited wiggle while the hearts float
      return frame < 36 ? { dx: Math.floor(frame / 4) % 2 === 0 ? -1 : 1, dy: 0 } : { dx: 0, dy: 0 };
    case 'evolve': {
      // the new form drops in and lands after the final flash
      if (frame < 33 || frame >= 47) return { dx: 0, dy: 0 };
      const t = (frame - 33) / 14;
      return { dx: 0, dy: -Math.round((1 - easeOut(t)) * 8) };
    }
    case 'refuse':
      // indignant head shake
      return frame < 14 ? { dx: frame % 4 < 2 ? -1 : 1, dy: 0 } : { dx: 0, dy: 0 };
    default:
      return { dx: 0, dy: 0 };
  }
}

function drawAnimation(ctx: CanvasRenderingContext2D, anim: AnimState) {
  const { type, frame } = anim;
  switch (type) {
    case 'feed':       animFeed(ctx, frame);       break;
    case 'play':       animPlay(ctx, frame);       break;
    case 'clean':      animClean(ctx, frame);      break;
    case 'medicine':   animMedicine(ctx, frame);   break;
    case 'discipline': animDiscipline(ctx, frame); break;
    case 'sleep':      animSleep(ctx, frame);      break;
    case 'wake':       animWake(ctx, frame);       break;
    case 'attention':  animAttention(ctx, frame);  break;
    case 'evolve':     animEvolve(ctx, frame);     break;
    case 'refuse':     animRefuse(ctx, frame);     break;
  }
}

// ─── Main draw ────────────────────────────────────────────────────────────────

export function drawCanvas(
  canvas: HTMLCanvasElement,
  pet: PetState,
  attention: boolean,
  anim?: AnimState | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = (pet.lightOff || pet.sleeping) ? '#030803' : '#0A1A0A';
  ctx.fillRect(0, 0, CW, CH);

  const dark = pet.lightOff || pet.sleeping;

  const spriteX = 24, spriteY = 18;

  // ── Egg phase: clean screen, just the egg + "?" bubble ───────────────────
  if (pet.creatureId === 'egg') {
    const t = Date.now();
    const eggFrame  = LINEAGE_EGG_FRAMES[pet.lineage]  ?? CREATURES.egg.idleFrames[0];
    const eggPalette = LINEAGE_EGG_PALETTES[pet.lineage] ?? CREATURES.egg.palette;
    // subtle wobble: ±1px every ~1.5 s
    const wobble = Math.floor(t / 1500) % 2 === 0 ? 0 : (Math.floor(t / 300) % 2 === 0 ? 1 : 0);
    drawShadow(ctx);
    drawSprite(ctx, eggFrame, eggPalette, spriteX + wobble, spriteY);
    // "?" thought bubble above egg
    const blink = Math.floor(t / 800) % 2 === 0;
    if (blink) {
      const qx = 37, qy = 11;
      // bubble dots
      px(ctx, qx - 3, qy + 4, '#2A3A2A'); px(ctx, qx - 2, qy + 5, '#2A3A2A');
      // "?" mark (5px tall)
      const Q = '#4ADE80';
      px(ctx, qx,   qy,   Q); px(ctx, qx+1, qy,   Q);
      px(ctx, qx+2, qy+1, Q);
      px(ctx, qx+1, qy+2, Q);
      px(ctx, qx+1, qy+4, Q);
    }
    applyScanlines(ctx);
    return;
  }

  if (!dark) {
    // Hearts
    for (let i = 0; i < 4; i++) drawDrumstickIcon(ctx, 2 + i * 6, 1, i < pet.hunger);
    for (let i = 0; i < 4; i++) drawSmileyIcon(ctx, CW - 26 + i * 6, 1, i < pet.happiness);
    if (pet.sick) {
      drawSick(ctx, CW / 2 - 1, 2);
    } else if (isNight(Date.now())) {
      // tiny crescent: it's bedtime — pets rest properly only at night
      const M = '#FDE68A';
      px(ctx, 31, 1, M); px(ctx, 32, 1, M);
      px(ctx, 30, 2, M);
      px(ctx, 30, 3, M);
      px(ctx, 31, 4, M); px(ctx, 32, 4, M);
    }
    // Separator
    ctx.fillStyle = '#1A3020';
    ctx.fillRect(0, 7, CW, 1);
  }

  if (pet.dead) {
    drawSkull(ctx, 28, 22);
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(22, 32, 20, 1);
    // "RIP" in tiny pixels
    const RIP = [
      [1,1,1,0,1,0,0,1,0,1,1,1],
      [1,0,1,0,1,0,0,1,0,0,0,1],
      [1,1,1,0,1,0,0,1,0,0,0,1],
      [1,1,0,0,1,0,0,1,0,0,0,1],
      [1,0,1,0,1,0,0,1,0,0,0,1],
    ];
    RIP.forEach((row, r) => row.forEach((b, c) => {
      if (b) { ctx.fillStyle = '#6B7280'; ctx.fillRect(22 + c, 35 + r, 1, 1); }
    }));
    applyScanlines(ctx);
    return;
  }

  if (pet.sleeping) {
    const creature = CREATURES[pet.creatureId];
    const off = animSpriteOffset(anim);
    drawShadow(ctx);
    drawSprite(ctx, creature.sleepFrames[0], getPalette(pet), spriteX + off.dx, spriteY + off.dy);
    drawZ(ctx, 42, 10);
    drawZ(ctx, 46, 7);
    if (anim) drawAnimation(ctx, anim);
    applyScanlines(ctx);
    return;
  }

  // Regular pet sprite
  const creature: CreatureData = CREATURES[pet.creatureId];
  let frames: string[][];
  switch (pet.emotionFrame) {
    case 'eat':   frames = creature.eatFrames;   break;
    case 'happy': frames = creature.happyFrames; break;
    case 'sleep': frames = creature.sleepFrames; break;
    default:      frames = creature.idleFrames;
  }
  const off = animSpriteOffset(anim);
  drawShadow(ctx);
  drawSprite(ctx, frames[pet.animFrame % frames.length], getPalette(pet), spriteX + off.dx, spriteY + off.dy);

  // Poop
  for (let i = 0; i < pet.poopCount; i++) drawPoop(ctx, 48 + i * 5, 46);

  // Passive state effects
  drawStateEffects(ctx, pet);

  // Animation overlay
  if (anim) drawAnimation(ctx, anim);

  applyScanlines(ctx);
}

function applyScanlines(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < CH; y += 2) ctx.fillRect(0, y, CW, 1);
}

// ─── Lineage palette helper ───────────────────────────────────────────────────
function getPalette(pet: PetState): Record<string, string> {
  const creature = CREATURES[pet.creatureId];
  if (pet.creatureId === 'blobby') {
    if (pet.lineage === 'sunny')  return { o: '#7A5A10', b: '#FFD966', h: '#FFF2B0', d: '#E0A820', e: '#3A2A10', m: '#FF8C00', f: '#3A2A10', k: '#FFB838' };
    if (pet.lineage === 'stormy') return { o: '#16324A', b: '#9BBFEA', h: '#D8EAF8', d: '#5580CC', e: '#1A3A6A', m: '#5580CC', f: '#1A3A6A', k: '#BDD4F2' };
    if (pet.lineage === 'misty')  return { o: '#3A1A66', b: '#CCA8EE', h: '#E8D8FF', d: '#9060D0', e: '#4A2080', m: '#9060D0', f: '#4A2080', k: '#E0CCFF' };
  }
  return creature.palette;
}

// ─── Certificate + share card ────────────────────────────────────────────────

export function renderCertificate(pet: PetState): HTMLCanvasElement {
  const W = 340, H = 480;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#0F0F23';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#7C3AED'; ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = '#A78BFA'; ctx.lineWidth = 1;
  ctx.strokeRect(13, 13, W - 26, H - 26);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#A78BFA';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText('DEATH CERTIFICATE', W / 2, 48);

  const creature = CREATURES[pet.creatureId];
  const frame = creature.idleFrames[0];
  const palette = getPalette(pet);
  const SCALE = 4;
  const sx = (W - 16 * SCALE) / 2, sy = 60;
  frame.forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === '.') return;
    const color = palette[ch];
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(sx + col * SCALE, sy + r * SCALE, SCALE, SCALE);
  }));

  ctx.fillStyle = '#4C1D95';
  ctx.fillRect(30, sy + 16 * SCALE + 8, W - 60, 1);

  ctx.textAlign = 'left';
  ctx.font = '7px "Press Start 2P", monospace';
  const ageH = Math.floor(pet.age);
  const ageD = Math.floor(ageH / 24);
  const fields: [string, string][] = [
    ['NAME',  pet.name],
    ['TYPE',  creature.name.toUpperCase()],
    ['GEN',   `${pet.generation ?? 1}`],
    ['AGE',   ageD > 0 ? `${ageD}D ${ageH % 24}H` : `${ageH}H`],
    ['CAUSE', (pet.causeOfDeath ?? 'UNKNOWN').toUpperCase()],
    ['BORN',  new Date(pet.bornAt).toLocaleDateString()],
    ['DIED',  pet.diedAt ? new Date(pet.diedAt).toLocaleDateString() : '???'],
    ['CARE',  `${pet.careScore}%`],
  ];
  const fy = sy + 16 * SCALE + 22;
  fields.forEach(([label, value], i) => {
    ctx.fillStyle = '#7C3AED'; ctx.fillText(label + ':', 36, fy + i * 24);
    ctx.fillStyle = '#E2E8F0'; ctx.fillText(value, 140, fy + i * 24);
  });

  ctx.fillStyle = '#4B5563'; ctx.font = '5px "Press Start 2P", monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${pet.mealsEaten} MEALS  ${pet.gamesPlayed} GAMES  ${pet.poopsCleaned} CLEANS`, W / 2, fy + fields.length * 24 + 10);
  // Achievement badges (up to 3 fit the card)
  const badges = getAchievements(pet).slice(0, 3).map(a => `★${a.label}`);
  if (badges.length) {
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(badges.join('  '), W / 2, fy + fields.length * 24 + 26);
  }
  ctx.fillStyle = '#6D28D9'; ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('BITLING', W / 2, H - 24);
  return c;
}

export function renderShareCard(pet: PetState): HTMLCanvasElement {
  const W = 300, H = 200;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#1A0A30'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#7C3AED'; ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  const creature = CREATURES[pet.creatureId];
  const frame = creature.idleFrames[0];
  const palette = getPalette(pet);
  const SCALE = 3;
  const sx = 20, sy = (H - 16 * SCALE) / 2;
  frame.forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === '.') return;
    const color = palette[ch];
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(sx + col * SCALE, sy + r * SCALE, SCALE, SCALE);
  }));

  const tx = sx + 16 * SCALE + 16;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#A78BFA'; ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText(pet.name, tx, 40);
  ctx.fillStyle = '#E2E8F0'; ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText(creature.name.toUpperCase(), tx, 58);
  ctx.fillStyle = '#6B7280';
  ctx.fillText(`AGE: ${Math.floor(pet.age)}H`, tx, 80);
  ctx.fillText(`CARE: ${pet.careScore}%`, tx, 96);

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < pet.hunger ? '#FF4466' : '#1A2E1A';
    ctx.fillRect(tx + 36 + i * 8, 108, 6, 6);
  }
  ctx.fillStyle = '#4B5563'; ctx.fillText('HUN:', tx, 116);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < pet.happiness ? '#4ADE80' : '#1A2E1A';
    ctx.fillRect(tx + 36 + i * 8, 126, 6, 6);
  }
  ctx.fillStyle = '#4B5563'; ctx.fillText('HAP:', tx, 134);

  ctx.fillStyle = '#6D28D9'; ctx.font = '5px "Press Start 2P", monospace'; ctx.textAlign = 'center';
  ctx.fillText('BITLING', W / 2, H - 12);
  return c;
}
