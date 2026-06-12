'use client';

import { useRef, useEffect } from 'react';
import { CREATURES, CreatureId } from '@/lib/creatures';

const DEX_ORDER: CreatureId[] = [
  'blobby', 'sunnling', 'grumbit', 'wisp',
  'puffi', 'grimble', 'lumix', 'gloom', 'phantom',
];

function SpriteCanvas({ id, discovered, size = 48 }: { id: CreatureId; discovered: boolean; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const creature = CREATURES[id];
    const frame = creature.idleFrames[0];
    const SCALE = size / 16;
    ctx.fillStyle = '#0A1A0A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    frame.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === '.') return;
        const color = discovered ? creature.palette[ch] : '#1E1238';
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE);
      });
    });
  }, [id, discovered, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ display: 'block', width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}

interface Props {
  discovered: CreatureId[];
  onClose: () => void;
}

export default function DexModal({ discovered, onClose }: Props) {
  const found = DEX_ORDER.filter(id => discovered.includes(id)).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 style={{
          fontFamily: 'var(--font-press-start)',
          fontSize: 10,
          color: '#A78BFA',
          letterSpacing: 2,
          textAlign: 'center',
        }}>
          CREATURE DEX
        </h2>
        <p style={{
          fontFamily: 'var(--font-vt323)',
          color: '#6B7280',
          fontSize: 16,
          textAlign: 'center',
          marginTop: -8,
        }}>
          {found} / {DEX_ORDER.length} forms discovered across all your pets
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}>
          {DEX_ORDER.map(id => {
            const isFound = discovered.includes(id);
            const creature = CREATURES[id];
            return (
              <div
                key={id}
                title={isFound ? creature.description : 'Not yet discovered'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 4px 8px',
                  background: isFound ? '#1A0A30' : '#110820',
                  border: `1px solid ${isFound ? '#4C1D95' : '#1E1238'}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ background: '#0A1A0A', borderRadius: 6, padding: 3 }}>
                  <SpriteCanvas id={id} discovered={isFound} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-press-start)',
                  fontSize: 5.5,
                  color: isFound ? '#C4B5FD' : '#2D1060',
                  letterSpacing: 0.5,
                }}>
                  {isFound ? creature.name.toUpperCase() : '???'}
                </span>
              </div>
            );
          })}
        </div>

        <button className="pixel-btn" onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
