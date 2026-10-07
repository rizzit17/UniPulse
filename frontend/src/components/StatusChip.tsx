import React from 'react';
import { RequestStatus } from '../types/api';

interface StatusChipProps {
  status: RequestStatus;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  let bg = 'var(--card)';
  let color = 'var(--ink)';

  switch (status) {
    case 'OPEN':
      bg = 'var(--card)';
      color = 'var(--ink)';
      break;
    case 'ASSIGNED':
      bg = 'var(--steel)';
      color = 'var(--paper)';
      break;
    case 'IN_PROGRESS':
      bg = 'var(--amber)';
      color = 'var(--ink)';
      break;
    case 'ON_HOLD':
    case 'NEEDS_INFO':
      bg = 'var(--clay)';
      color = 'var(--ink)';
      break;
    case 'RESOLVED':
      bg = 'var(--moss)';
      color = 'var(--paper)';
      break;
    case 'CLOSED':
      bg = 'var(--paper-2)';
      color = 'var(--ink-2)';
      break;
    case 'REOPENED':
    case 'REJECTED':
      bg = 'var(--brick)';
      color = 'var(--paper)';
      break;
    case 'CANCELLED':
      bg = 'var(--paper-2)';
      color = 'var(--ink-3)';
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
      {status.replace('_', ' ')}
    </span>
  );
};
