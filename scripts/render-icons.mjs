// Generates public/icon-192.png and public/icon-512.png from the Puffi
// sprite.  Run with: npx tsx scripts/render-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { CREATURES } from '../src/lib/creatures.ts';

const SPRITE = CREATURES.puffi.idleFrames[0];
const PALETTE = CREATURES.puffi.palette;

function renderIcon(size) {
  const scale = Math.floor((size * 0.84) / 16);
  const offset = Math.floor((size - 16 * scale) / 2);
  const img = new Uint8Array(size * size * 3);

  // background: deep violet with a subtle radial-ish vignette
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
      const t = Math.min(1, d);
      const i = (y * size + x) * 3;
      img[i]     = Math.round(0x2d * (1 - t) + 0x0f * t);
      img[i + 1] = Math.round(0x0a * (1 - t) + 0x0f * t);
      img[i + 2] = Math.round(0x6b * (1 - t) + 0x23 * t);
    }
  }

  SPRITE.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || !PALETTE[ch]) return;
    const hex = PALETTE[ch];
    const cr = parseInt(hex.slice(1, 3), 16), cg = parseInt(hex.slice(3, 5), 16), cb = parseInt(hex.slice(5, 7), 16);
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const x = offset + c * scale + dx, y = offset + r * scale + dy;
        const i = (y * size + x) * 3;
        img[i] = cr; img[i + 1] = cg; img[i + 2] = cb;
      }
    }
  }));

  return encodePng(img, size, size);
}

function encodePng(img, W, H) {
  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4);
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(H * (W * 3 + 1));
  for (let y = 0; y < H; y++) {
    Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icon-192.png', renderIcon(192));
writeFileSync('public/icon-512.png', renderIcon(512));
console.log('OK — wrote public/icon-192.png and public/icon-512.png');
