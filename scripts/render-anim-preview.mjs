// Renders a contact sheet of every action animation (sampled frames of the
// real drawCanvas composition) to a PNG.  Run with:
//   node --experimental-strip-types scripts/render-anim-preview.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { drawCanvas, ANIM_FRAMES, CW, CH } from '../src/lib/canvasRenderer.ts';

const SCALE = 3;
const SAMPLES = 7;
const PAD = 4;
const TYPES = Object.keys(ANIM_FRAMES);

const W = SAMPLES * (CW * SCALE + PAD) + PAD;
const H = TYPES.length * (CH * SCALE + PAD) + PAD;
const img = new Uint8Array(W * H * 3).fill(0x10);

// Minimal mock of the 2D canvas API surface used by drawCanvas
function makeCtx(ox, oy) {
  return {
    fillStyle: '#000000',
    globalAlpha: 1,
    fillRect(x, y, w, h) {
      const c = this.fillStyle;
      if (typeof c !== 'string' || c[0] !== '#') return; // skip rgba() overlays
      const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          if (xx < 0 || xx >= CW || yy < 0 || yy >= CH) continue;
          for (let sy = 0; sy < SCALE; sy++) {
            for (let sx = 0; sx < SCALE; sx++) {
              const i = ((oy + yy * SCALE + sy) * W + ox + xx * SCALE + sx) * 3;
              img[i] = r; img[i + 1] = g; img[i + 2] = b;
            }
          }
        }
      }
    },
  };
}

function makePet(type) {
  return {
    version: 2, id: 'PREVIEW', creatureId: 'puffi', name: 'PREVIEW', lineage: 'sunny',
    generation: 1, age: 1, hunger: 4, happiness: 4, weight: 20, discipline: 2,
    sick: false, sleeping: type === 'sleep', lightOff: false, poopCount: type === 'clean' ? 1 : 0,
    falseAlarm: false, falseAlarmTicks: 0,
    dead: false, careScore: 100, neglectCount: 0, bornAt: Date.now(), lastTick: Date.now(),
    ticksElapsed: 0, evolutionStage: 1, mealsEaten: 0, gamesPlayed: 0, poopsCleaned: 0,
    medicineGiven: 0, timesSick: 0,
    animFrame: 0, emotionFrame: 'idle', emotionTimer: 0,
  };
}

TYPES.forEach((type, row) => {
  const total = ANIM_FRAMES[type];
  const pet = makePet(type);
  for (let col = 0; col < SAMPLES; col++) {
    const frame = Math.min(total - 1, Math.round((col * (total - 1)) / (SAMPLES - 1)));
    const ctx = makeCtx(PAD + col * (CW * SCALE + PAD), PAD + row * (CH * SCALE + PAD));
    const canvas = { getContext: () => ctx };
    drawCanvas(canvas, pet, false, { type, frame });
  }
});

// ── Minimal PNG encoder ───────────────────────────────────────────────────────
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2;
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) {
  Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync('/tmp/anim-preview.png', png);
console.log(`OK — wrote /tmp/anim-preview.png (${W}×${H}); rows: ${TYPES.join(', ')}`);
