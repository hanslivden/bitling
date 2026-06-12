'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
}

const PAGES = [
  {
    title: 'WHAT IS BITLING?',
    content: (
      <>
        <p>BITLING is a virtual pet that lives in your browser.</p>
        <p>It starts as a tiny egg and grows into one of several creatures — depending on how well you look after it.</p>
        <p>Check in a few times a day. Feed it. Play with it. Keep it clean.</p>
        <p style={{ color: '#A78BFA' }}>It is designed for work. A few minutes of care every couple of hours is enough to keep it alive.</p>
      </>
    ),
  },
  {
    title: 'THE BUTTONS',
    content: (
      <>
        <BtnRow icon="◀" label="LEFT" desc="Press once to open the action menu. Then press again to cycle left through actions." />
        <BtnRow icon="●" label="MIDDLE" desc="Opens the menu if closed. Confirms and executes the selected action." />
        <BtnRow icon="▶" label="RIGHT" desc="Press once to open the menu. Then cycle right through actions." />
        <p style={{ color: '#6B7280', marginTop: 8 }}>The menu closes automatically after 5 seconds of inactivity.</p>
      </>
    ),
  },
  {
    title: 'THE ACTIONS',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ActionRow icon="FOOD" color="#86EFAC" desc="Feed your pet a meal. Raises hunger. Don't overfeed — at 40g+ it gets sick more easily." />
        <ActionRow icon="LITE" color="#FDE68A" desc="Toggle the light. Sleep only counts at night (9pm–8am) — a moon icon shows when it's bedtime. Daytime naps restore nothing." />
        <ActionRow icon="PLAY" color="#93C5FD" desc="Play the guessing game: pick which way your pet will look, 4 rounds. Win to gain happiness and burn weight." />
        <ActionRow icon="MEDS" color="#F9A8D4" desc="Give medicine. Only works when your pet is sick. Check if the skull icon is showing." />
        <ActionRow icon="TIDY" color="#6EE7B7" desc="Clean up poop. Too much poop makes your pet sick." />
        <ActionRow icon="DISC" color="#FCA5A5" desc="Discipline. Use it when your pet calls for no reason (a !? appears). Spoiled pets refuse food and games." />
        <ActionRow icon="STAT" color="#C4B5FD" desc="View stats — name, generation, age, weight, discipline, and care score." />
        <ActionRow icon="HEY!" color="#FCD34D" desc="Check on your pet. Calms the attention indicator (the red blinking dot)." />
      </div>
    ),
  },
  {
    title: 'STATUS BAR',
    content: (
      <>
        <p>At the top of the screen you will see two rows of small hearts.</p>
        <StatRow label="Left hearts" color="#FF4466" desc="Hunger — 4 filled = full, 0 = starving." />
        <StatRow label="Right hearts" color="#4ADE80" desc="Happiness — keep these full by playing." />
        <StatRow label="Red dot (top right)" color="#EF4444" desc="Attention needed — your pet is hungry, dirty, or sick. Open the menu and check." />
        <StatRow label="X mark (centre)" color="#F87171" desc="Your pet is sick. Use MEDS immediately." />
        <p style={{ color: '#6B7280', marginTop: 8 }}>If hunger AND happiness both hit zero for too long, your pet will die.</p>
      </>
    ),
  },
  {
    title: 'GROWING UP',
    content: (
      <>
        <p>Your pet evolves over real time.</p>
        <p style={{ color: '#FDE68A' }}>Egg → hatches after ~5 minutes</p>
        <p style={{ color: '#86EFAC' }}>Baby → becomes a child after 24 hours</p>
        <p style={{ color: '#A78BFA' }}>Child → becomes an adult after 3 days</p>
        <p style={{ marginTop: 8 }}>What it grows into depends on how well you cared for it. Good care leads to one creature. Neglect leads to another.</p>
        <p style={{ color: '#A78BFA', marginTop: 8 }}>There are 9 forms to discover — check the DEX to track them. One is a secret born of neglect.</p>
        <p style={{ color: '#FCD34D', marginTop: 8 }}>When a pet dies, its line continues: the next egg is the following generation.</p>
      </>
    ),
  },
  {
    title: 'SHARING & SAVING',
    content: (
      <>
        <StatRow label="BOOKMARK" color="#C4B5FD" desc="Copies a URL with your pet ID. Revisit it any time on the same device to find your pet waiting." />
        <StatRow label="SHARE PET" color="#93C5FD" desc="Copies a snapshot link. Anyone can open it and see your pet — read only." />
        <StatRow label="TOP PETS" color="#FDE68A" desc="The leaderboard. Shows the oldest Bitlings that have ever died. Your pet is submitted automatically when it passes away." />
        <p style={{ color: '#6B7280', marginTop: 10 }}>When your pet dies you receive a Death Certificate — a downloadable PNG with its full life story.</p>
        <p style={{ color: '#6B7280', marginTop: 6 }}>From the leaderboard you can also download a shareable pet card image.</p>
      </>
    ),
  },
  {
    title: 'TIPS',
    content: (
      <>
        <Tip>Check in at least twice a day. Morning and afternoon is enough.</Tip>
        <Tip>Clean poop as soon as you see it — 3 poops = guaranteed sickness.</Tip>
        <Tip>Sleep at night (when the moon icon shows). Night sleep slowly restores care; staying up late drains happiness fast.</Tip>
        <Tip>If your pet calls with a !? and nothing is wrong, answer with DISC. Ignoring false alarms costs care score.</Tip>
        <Tip>Keep weight under 40g — play the guessing game to slim down.</Tip>
        <Tip>The care score (visible under STAT) tracks your overall performance and decides what your pet evolves into.</Tip>
        <Tip>Use ← → and Enter on a keyboard. ALERTS can ping you when your pet needs care while the tab is hidden.</Tip>
        <Tip>Bookmark the URL so you can come back to the same pet from any tab.</Tip>
      </>
    ),
  },
];

export default function Tutorial({ onClose }: Props) {
  const [page, setPage] = useState(0);
  const isLast = page === PAGES.length - 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === page ? '#7C3AED' : '#2D1060',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'var(--font-press-start)',
          fontSize: 9,
          color: '#A78BFA',
          letterSpacing: 1,
          textAlign: 'center',
        }}>
          {PAGES[page].title}
        </h2>

        {/* Content */}
        <div style={{
          fontFamily: 'var(--font-vt323)',
          fontSize: 19,
          color: '#E2E8F0',
          lineHeight: 1.6,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'auto',
          flex: 1,
        }}>
          {PAGES[page].content}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <NavBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            ◀ PREV
          </NavBtn>

          {isLast ? (
            <NavBtn onClick={onClose} primary>
              LET&apos;S GO ▶
            </NavBtn>
          ) : (
            <NavBtn onClick={() => setPage(p => p + 1)} primary>
              NEXT ▶
            </NavBtn>
          )}
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-press-start)',
              fontSize: 6,
              color: '#2D1060',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            SKIP TUTORIAL
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BtnRow({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 12,
        color: '#EC4899',
        minWidth: 20,
        textAlign: 'center',
        marginTop: 2,
      }}>
        {icon}
      </div>
      <div>
        <span style={{ color: '#A78BFA', fontFamily: 'var(--font-press-start)', fontSize: 7 }}>
          {label}
        </span>
        <p style={{ marginTop: 3, color: '#D1D5DB' }}>{desc}</p>
      </div>
    </div>
  );
}

function ActionRow({ icon, color, desc }: { icon: string; color: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 6,
        color,
        background: '#1A0A30',
        border: `1px solid ${color}44`,
        borderRadius: 3,
        padding: '3px 5px',
        minWidth: 36,
        textAlign: 'center',
        flexShrink: 0,
        marginTop: 2,
      }}>
        {icon}
      </span>
      <p style={{ color: '#D1D5DB', fontSize: 17 }}>{desc}</p>
    </div>
  );
}

function StatRow({ label, color, desc }: { label: string; color: string; desc: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ color, fontFamily: 'var(--font-press-start)', fontSize: 6 }}>{label}</span>
      <p style={{ color: '#D1D5DB', marginTop: 3 }}>{desc}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: '#7C3AED', flexShrink: 0, marginTop: 1 }}>▸</span>
      <p style={{ color: '#D1D5DB' }}>{children}</p>
    </div>
  );
}

function NavBtn({
  children, onClick, disabled = false, primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: 'var(--font-press-start)',
        fontSize: 7,
        padding: '7px 14px',
        background: primary ? '#4C1D95' : '#1A0A30',
        color: disabled ? '#2D1060' : primary ? '#EDE9FE' : '#7C3AED',
        border: `1px solid ${disabled ? '#1A0A30' : primary ? '#7C3AED' : '#4C1D95'}`,
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}
