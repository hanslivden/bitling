'use client';

import { useEffect, useState } from 'react';
import type { PetState } from '@/lib/petState';
import { CREATURES } from '@/lib/creatures';
import { renderShareCard } from '@/lib/canvasRenderer';
import { buildShareUrl } from '@/lib/share';

interface Entry {
  id: string;
  petName: string;
  creatureId: string;
  ageHours: number;
  causeOfDeath: string;
  diedAt: number;
  careScore: number;
  mealsEaten: number;
  gamesPlayed: number;
}

interface Props {
  pet: PetState;
  onClose: () => void;
}

export default function Leaderboard({ pet, onClose }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => (r.ok ? r.json() : []))
      .then((data: Entry[]) => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleShareCard = () => {
    const card = renderShareCard(pet);
    const a = document.createElement('a');
    a.href = card.toDataURL('image/png');
    a.download = `${pet.name}-bitling-card.png`;
    a.click();
  };

  const handleCopyShareLink = () => {
    const url = buildShareUrl(pet);
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('Copied!');
      setTimeout(() => setShareMsg(''), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0F0F23',
          border: '2px solid #7C3AED',
          borderRadius: 12,
          padding: 20,
          maxWidth: 360,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-press-start)',
          fontSize: 10,
          color: '#A78BFA',
          letterSpacing: 2,
          textAlign: 'center',
        }}>
          HALL OF FAME
        </h2>
        <p style={{
          fontFamily: 'var(--font-vt323)',
          color: '#6B7280',
          fontSize: 16,
          textAlign: 'center',
          marginTop: -10,
        }}>
          Oldest surviving Bitlings
        </p>

        {/* Current pet share card */}
        <div style={{
          background: '#1A0A30',
          border: '1px solid #4C1D95',
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-press-start)', fontSize: 7, color: '#C4B5FD' }}>
              YOUR PET
            </p>
            <p style={{ fontFamily: 'var(--font-vt323)', fontSize: 20, color: '#E2E8F0', marginTop: 2 }}>
              {pet.name} · {CREATURES[pet.creatureId].name}
            </p>
            <p style={{ fontFamily: 'var(--font-vt323)', fontSize: 16, color: '#9CA3AF' }}>
              Age: {Math.floor(pet.age)}h · Care: {pet.careScore}%
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <LbBtn onClick={handleShareCard}>CARD</LbBtn>
            <LbBtn onClick={handleCopyShareLink}>LINK</LbBtn>
          </div>
        </div>
        {shareMsg && (
          <p style={{ fontFamily: 'var(--font-vt323)', color: '#4ADE80', fontSize: 16, textAlign: 'center', marginTop: -8 }}>
            {shareMsg}
          </p>
        )}

        {/* Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading && (
            <p style={{ fontFamily: 'var(--font-press-start)', fontSize: 7, color: '#4ADE80', textAlign: 'center' }}>
              LOADING...
            </p>
          )}
          {!loading && entries.length === 0 && (
            <p style={{ fontFamily: 'var(--font-vt323)', color: '#4B5563', fontSize: 18, textAlign: 'center' }}>
              No entries yet. Be the first!
            </p>
          )}
          {entries.map((e, i) => {
            const creature = CREATURES[e.creatureId as keyof typeof CREATURES];
            const ageD = Math.floor(e.ageHours / 24);
            const ageH = e.ageHours % 24;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            return (
              <div
                key={e.id}
                style={{
                  background: i < 3 ? '#1A0A30' : '#110820',
                  border: `1px solid ${i === 0 ? '#7C3AED' : '#2D1060'}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'var(--font-press-start)', fontSize: 8, color: '#A78BFA', minWidth: 24 }}>
                  {medal}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-press-start)', fontSize: 7, color: '#E2E8F0' }}>
                    {e.petName}
                  </p>
                  <p style={{ fontFamily: 'var(--font-vt323)', fontSize: 15, color: '#9CA3AF', marginTop: 2 }}>
                    {creature?.name ?? e.creatureId} · {ageD > 0 ? `${ageD}d ${ageH}h` : `${e.ageHours}h`}
                  </p>
                </div>
                <div style={{
                  fontFamily: 'var(--font-press-start)',
                  fontSize: 6,
                  color: '#6D28D9',
                  textAlign: 'right',
                }}>
                  <div>{e.careScore}%</div>
                  <div style={{ color: '#374151', marginTop: 2 }}>
                    {(e.causeOfDeath ?? '???').slice(0, 6).toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <LbBtn onClick={onClose}>CLOSE</LbBtn>
      </div>
    </div>
  );
}

function LbBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 6,
        padding: '5px 10px',
        background: '#1A0A30',
        color: '#7C3AED',
        border: '1px solid #4C1D95',
        borderRadius: 4,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
