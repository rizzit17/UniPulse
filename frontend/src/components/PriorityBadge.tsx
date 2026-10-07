import React from 'react';
import { RequestPriority } from '../types/api';

interface PriorityBadgeProps {
  priority: RequestPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  let bg = 'var(--card)';
  let color = 'var(--ink)';
  let label: string = priority;

  switch (priority) {
    case 'P1':
      bg = 'var(--brick)';
      color = 'var(--paper)';
      label = 'P1 CRITICAL';
      break;
    case 'P2':
      bg = 'var(--amber)';
      color = 'var(--ink)';
      label = 'P2 HIGH';
      break;
    case 'P3':
      bg = 'var(--card)';
      color = 'var(--ink)';
      label = 'P3 MEDIUM';
      break;
    case 'P4':
      bg = 'var(--paper-2)';
      color = 'var(--ink-3)';
      label = 'P4 LOW';
      break;
  }

  return (
    <span
      className="stamp-chip"
      style={{
        backgroundColor: bg,
        color: color,
        border: 'var(--bw) solid var(--ink)',
      }}
    >
      {label}
    </span>
  );
};
