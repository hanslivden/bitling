'use client';

import { useRef, useEffect, useState } from 'react';
import { LINEAGE_EGG_FRAMES, LINEAGE_EGG_PALETTES } from '@/lib/creatures';
import type { Lineage } from '@/lib/petState';

const STARTERS = [
  { lineage: 'sunny'  as Lineage, label: 'SUNNY',  tag: 'Cheerful · Friendly',  accent: '#FFD700', cardBg: '#1A1200' },
  { lineage: 'stormy' as Lineage, label: 'STORMY', tag: 'Tough · Resilient',     accent: '#60A5FA', cardBg: '#00101E' },
  { lineage: 'misty'  as Lineage, label: 'MISTY',  tag: '??? · Unpredictable',   accent: '#A78BFA', cardBg: '#0A0014' },
];

function EggCanvas({ lineage, size = 48 }: { lineage: Lineage; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = LINEAGE_EGG_FRAMES[lineage];
  const palette = LINEAGE_EGG_PALETTES[lineage];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const SCALE = size / 16;
    ctx.fillStyle = '#0A1A0A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    frame.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === '.') return;
        const color = palette[ch];
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE);
      });
    });
  }, [frame, palette, size]);

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
  onCreate: (lineage: Lineage, name: string) => void;
}

export default function StarterPicker({ onCreate }: Props) {
  const [step, setStep] = useState<'pick' | 'name'>('pick');
  const [chosenLineage, setChosenLineage] = useState<Lineage>('sunny');
  const [name, setName] = useState('');

  const accent = STARTERS.find(s => s.lineage === chosenLineage)?.accent ?? '#A78BFA';

  const handlePickEgg = (lineage: Lineage) => {
    setChosenLineage(lineage);
    setName('');
    setStep('name');
  };

  const handleConfirm = () => {
    onCreate(chosenLineage, name.trim() || 'Blobby');
  };

  // ── Step 1: pick egg ────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-press-start)', fontSize: 9, color: '#A78BFA', letterSpacing: 2, marginBottom: 8 }}>
            CHOOSE YOUR EGG
          </h2>
          <p style={{ fontFamily: 'var(--font-vt323)', fontSize: 18, color: '#4B5563' }}>
            What hatches depends on how you raise it.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {STARTERS.map((s) => (
            <button
              key={s.lineage}
              onClick={() => handlePickEgg(s.lineage)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '14px 10px', background: s.cardBg,
                border: `2px solid ${s.accent}33`, borderRadius: 10,
                cursor: 'pointer', width: 90,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = s.accent;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 12px ${s.accent}44`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${s.accent}33`;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ background: '#0A1A0A', borderRadius: 6, padding: 3, border: `1px solid ${s.accent}22` }}>
                <EggCanvas lineage={s.lineage} />
              </div>
              <span style={{ fontFamily: 'var(--font-press-start)', fontSize: 5.5, color: s.accent, letterSpacing: 1 }}>
                {s.label}
              </span>
              <span style={{ fontFamily: 'var(--font-vt323)', fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 1.3 }}>
                {s.tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: name your pet ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 280 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-press-start)', fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 8 }}>
          NAME YOUR PET
        </h2>
        <p style={{ fontFamily: 'var(--font-vt323)', fontSize: 18, color: '#4B5563' }}>
          Up to 10 characters. Leave blank for a random name.
        </p>
      </div>

      {/* Egg preview */}
      <div style={{ background: '#0A1A0A', borderRadius: 10, padding: 8, border: `2px solid ${accent}44` }}>
        <EggCanvas lineage={chosenLineage} size={64} />
      </div>

      {/* Name input */}
      <input
        autoFocus
        maxLength={10}
        value={name}
        onChange={e => setName(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        placeholder="BLOBBY"
        style={{
          fontFamily: 'var(--font-press-start)',
          fontSize: 11,
          letterSpacing: 3,
          textAlign: 'center',
          width: '100%',
          padding: '10px 12px',
          background: '#0A0A1A',
          border: `2px solid ${accent}66`,
          borderRadius: 6,
          color: accent,
          outline: 'none',
          caretColor: accent,
        }}
        onFocus={e => (e.target.style.borderColor = accent)}
        onBlur={e => (e.target.style.borderColor = `${accent}66`)}
      />

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button
          onClick={() => setStep('pick')}
          style={{
            flex: 1, fontFamily: 'var(--font-press-start)', fontSize: 7,
            padding: '8px 0', background: '#1A0A30', color: '#4B5563',
            border: '1px solid #2D1060', borderRadius: 4, cursor: 'pointer',
          }}
        >
          ◀ BACK
        </button>
        <button
          onClick={handleConfirm}
          style={{
            flex: 2, fontFamily: 'var(--font-press-start)', fontSize: 7,
            padding: '8px 0', background: '#2D1060', color: accent,
            border: `1px solid ${accent}`, borderRadius: 4, cursor: 'pointer',
          }}
        >
          HATCH ▶
        </button>
      </div>
    </div>
  );
}
