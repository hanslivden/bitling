'use client';

import {
  Utensils, Lightbulb, Gamepad2, Pill,
  Sparkles, Bell, BarChart2, HandHeart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ACTIONS = [
  'food', 'light', 'play', 'medicine',
  'toilet', 'discipline', 'status', 'attention',
] as const;
export type Action = typeof ACTIONS[number];

interface ActionDef {
  label: string;
  icon: LucideIcon;
  color: string;
  hint: string;
}

export const ACTION_DEFS: Record<Action, ActionDef> = {
  food:       { label: 'FEED',    icon: Utensils,   color: '#86EFAC', hint: 'Fill hunger' },
  light:      { label: 'LIGHT',   icon: Lightbulb,  color: '#FDE68A', hint: 'Sleep/wake' },
  play:       { label: 'PLAY',    icon: Gamepad2,   color: '#93C5FD', hint: '+Happiness' },
  medicine:   { label: 'MEDS',    icon: Pill,       color: '#F9A8D4', hint: 'Cure sickness' },
  toilet:     { label: 'CLEAN',   icon: Sparkles,   color: '#6EE7B7', hint: 'Remove poop' },
  discipline: { label: 'DISC',    icon: Bell,       color: '#FCA5A5', hint: '+Discipline' },
  status:     { label: 'STATUS',  icon: BarChart2,  color: '#C4B5FD', hint: 'View stats' },
  attention:  { label: 'CHECK',   icon: HandHeart,  color: '#FCD34D', hint: 'Calm pet' },
};

interface Props {
  visible: boolean;
  selected: number;
  onSelect: (index: number) => void;
  onExecute: (index: number) => void;
}

export default function ActionMenu({ visible, selected, onSelect, onExecute }: Props) {
  if (!visible) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 4,
      padding: '8px 4px',
      background: 'linear-gradient(to bottom, #110030, #0F0F23)',
      borderRadius: '0 0 6px 6px',
      borderTop: '1px solid #2D1060',
      animation: 'slideDown 0.12s ease-out',
    }}>
      {ACTIONS.map((action, i) => {
        const def = ACTION_DEFS[action];
        const Icon = def.icon;
        const isSelected = i === selected;

        return (
          <button
            key={action}
            onClick={() => {
              onSelect(i);
              onExecute(i);
            }}
            onMouseEnter={() => onSelect(i)}
            title={def.hint}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '6px 2px',
              background: isSelected ? `${def.color}18` : 'transparent',
              border: isSelected ? `1px solid ${def.color}66` : '1px solid transparent',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            <Icon
              size={16}
              color={isSelected ? def.color : '#3D1A70'}
              strokeWidth={isSelected ? 2.5 : 2}
              style={{ transition: 'all 0.1s' }}
            />
            <span style={{
              fontFamily: 'var(--font-press-start)',
              fontSize: 4.5,
              color: isSelected ? def.color : '#3D1A70',
              letterSpacing: 0.5,
              lineHeight: 1,
            }}>
              {def.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
