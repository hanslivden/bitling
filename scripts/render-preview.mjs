// Renders every creature frame to a sprite-sheet PNG and validates frame
// dimensions / palette coverage.  Run with:
//   node --experimental-strip-types scripts/render-preview.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { CREATURES, LINEAGE_EGG_FRAMES, LINEAGE_EGG_PALETTES } from '../src/lib/creatures.ts';

const SCALE = Number(process.env.SCALE ?? 6);
const ONLY = process.env.ONLY?.split(','); // e.g. ONLY=wisp,gloom
const CELL = 16 * SCALE + 8;
const FRAME_SETS = ['idleFrames', 'sleepFrames', 'eatFrames', 'happyFrames'];

// ── Validate ──────────────────────────────────────────────────────────────────
let errors = 0;
function validate(name, frame, palette) {
  if (frame.length !== 16) { console.error(`${name}: ${frame.length} rows`); errors++; }
  frame.forEach((row, r) => {
    if (row.length !== 16) { console.error(`${name} row ${r}: ${row.length} cols: "${row}"`); errors++; }
    for (const ch of row) {
      if (ch !== '.' && !palette[ch]) { console.error(`${name} row ${r}: unknown char "${ch}"`); errors++; }
    }
  });
}

const rows = []; // each row: array of { frame, palette }
for (const c of Object.values(CREATURES)) {
  if (ONLY && !ONLY.includes(c.id)) continue;
  const frames = [];
  for (const set of FRAME_SETS) {
    c[set].forEach((f, i) => {
      validate(`${c.id}.${set}[${i}]`, f, c.palette);
      frames.push({ frame: f, palette: c.palette });
    });
  }
  rows.push(frames);
}
const eggRow = [];
for (const [lin, frame] of Object.entries(LINEAGE_EGG_FRAMES)) {
  validate(`egg.${lin}`, frame, LINEAGE_EGG_PALETTES[lin]);
  eggRow.push({ frame, palette: LINEAGE_EGG_PALETTES[lin] });
}
rows.push(eggRow);

if (errors) { console.error(`\n${errors} validation error(s)`); process.exit(1); }

// ── Rasterize ─────────────────────────────────────────────────────────────────
const W = Math.max(...rows.map(r => r.length)) * CELL;
const H = rows.length * CELL;
const img = new Uint8Array(W * H * 3).fill(0x10); // dark bg

function put(x, y, hex) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = parseInt(hex.slice(1, 3), 16);
  img[i + 1] = parseInt(hex.slice(3, 5), 16);
  img[i + 2] = parseInt(hex.slice(5, 7), 16);
}

rows.forEach((row, ry) => row.forEach(({ frame, palette }, cx) => {
  const ox = cx * CELL + 4, oy = ry * CELL + 4;
  for (let y = 0; y < 16 * SCALE; y++)
    for (let x = 0; x < 16 * SCALE; x++) put(ox + x, oy + y, '#0A1A0A');
  frame.forEach((line, r) => [...line].forEach((ch, c) => {
    if (ch === '.' || !palette[ch]) return;
    for (let dy = 0; dy < SCALE; dy++)
      for (let dx = 0; dx < SCALE; dx++)
        put(ox + c * SCALE + dx, oy + r * SCALE + dy, palette[ch]);
  }));
}));

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
ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0; // filter: none
  Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync('/tmp/sprite-preview.png', png);
console.log(`OK — wrote /tmp/sprite-preview.png (${W}×${H})`);
