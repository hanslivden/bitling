'use client';

import { useEffect, useRef } from 'react';
import type { PetState } from '@/lib/petState';
import { CREATURES } from '@/lib/creatures';
import { renderCertificate } from '@/lib/canvasRenderer';
import { getAchievements } from '@/lib/achievements';

interface Props {
  pet: PetState;
  onClose: () => void;
  onNewPet: () => void;
}

export default function DeathCertificate({ pet, onClose, onNewPet }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const creature = CREATURES[pet.creatureId];

  useEffect(() => {
    const cert = renderCertificate(pet);
    const target = canvasRef.current;
    if (!target) return;
    target.width = cert.width;
    target.height = cert.height;
    target.getContext('2d')!.drawImage(cert, 0, 0);
  }, [pet]);

  const download = () => {
    const cert = renderCertificate(pet);
    const a = document.createElement('a');
    a.href = cert.toDataURL('image/png');
    a.download = `${pet.name}-death-certificate.png`;
    a.click();
  };

  const ageH = Math.floor(pet.age);
  const ageLabel = ageH > 48
    ? `${Math.floor(ageH / 24)} days, ${ageH % 24} hours`
    : `${ageH} hours`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-press-start)',
            fontSize: 10,
            color: '#A78BFA',
            letterSpacing: 2,
            marginBottom: 4,
          }}>
            R.I.P.
          </p>
          <p style={{
            fontFamily: 'var(--font-vt323)',
            fontSize: 28,
            color: '#E2E8F0',
          }}>
            {pet.name} the {creature.name}
            {(pet.generation ?? 1) > 1 && (
              <span style={{ color: '#FCD34D', fontSize: 18 }}> · GEN {pet.generation}</span>
            )}
          </p>
        </div>

        {/* Certificate preview */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: 340,
              imageRendering: 'pixelated',
              border: '1px solid #4C1D95',
              borderRadius: 4,
            }}
          />
        </div>

        {/* Summary */}
        <div style={{
          fontFamily: 'var(--font-vt323)',
          fontSize: 18,
          color: '#9CA3AF',
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          <span style={{ color: '#C4B5FD' }}>{pet.name}</span> lived for{' '}
          <span style={{ color: '#FCD34D' }}>{ageLabel}</span>.{' '}
          Cause of death:{' '}
          <span style={{ color: '#FCA5A5' }}>
            {pet.causeOfDeath ?? 'unknown'}
          </span>.
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontFamily: 'var(--font-press-start)',
          fontSize: 6,
          color: '#6B7280',
        }}>
          {[
            ['MEALS', pet.mealsEaten],
            ['GAMES', pet.gamesPlayed],
            ['CLEANS', pet.poopsCleaned],
            ['CARE', `${pet.careScore}%`],
          ].map(([label, value]) => (
            <div key={label as string} style={{
              background: '#1A0A30',
              border: '1px solid #2D1060',
              borderRadius: 4,
              padding: '6px 10px',
            }}>
              <div style={{ color: '#7C3AED', marginBottom: 3 }}>{label}</div>
              <div style={{ color: '#E2E8F0', fontSize: 8 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {getAchievements(pet).length > 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {getAchievements(pet).map(a => (
              <span
                key={a.id}
                title={a.desc}
                style={{
                  fontFamily: 'var(--font-press-start)',
                  fontSize: 6,
                  color: '#FCD34D',
                  background: '#1A1200',
                  border: '1px solid #FCD34D44',
                  borderRadius: 4,
                  padding: '4px 7px',
                  letterSpacing: 0.5,
                }}
              >
                ★ {a.label}
              </span>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <CertBtn onClick={download}>DOWNLOAD PNG</CertBtn>
          <CertBtn onClick={onNewPet} primary>ADOPT NEW PET</CertBtn>
          <CertBtn onClick={onClose}>CLOSE</CertBtn>
        </div>
      </div>
    </div>
  );
}

function CertBtn({ children, onClick, primary = false }: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 7,
        padding: '7px 12px',
        background: primary ? '#4C1D95' : '#1A0A30',
        color: primary ? '#EDE9FE' : '#7C3AED',
        border: `1px solid ${primary ? '#7C3AED' : '#4C1D95'}`,
        borderRadius: 4,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
