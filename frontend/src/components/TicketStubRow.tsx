import React from 'react';
import { ServiceRequest } from '../types/api';
import { StatusChip } from './StatusChip';
import { PriorityBadge } from './PriorityBadge';

interface TicketStubRowProps {
  request: ServiceRequest;
  onClick: (request: ServiceRequest) => void;
}

export const TicketStubRow: React.FC<TicketStubRowProps> = ({ request, onClick }) => {
  const getPriorityColor = () => {
    switch (request.priority) {
      case 'P1': return 'var(--brick)';
      case 'P2': return 'var(--amber)';
      case 'P3': return 'var(--ink-2)';
      case 'P4': return 'var(--paper-2)';
    }
  };

  const computeSlaStatus = () => {
    if (!request.resolveBy) return null;
    const diff = new Date(request.resolveBy).getTime() - Date.now();
    const isBreached = diff <= 0 || request.slaBreached;

    if (isBreached) {
      const minutesAgo = Math.abs(Math.round(diff / (1000 * 60)));
      return {
        breached: true,
        text: `BREACHED ${minutesAgo > 0 ? minutesAgo + 'm AGO' : ''}`,
      };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      breached: false,
      text: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} LEFT`,
      atRisk: diff < 1000 * 60 * 30, // under 30 mins
    };
  };

  const sla = computeSlaStatus();

  return (
    <div
      onClick={() => onClick(request)}
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr 130px 130px 140px',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'var(--card)',
        border: 'var(--bw) solid var(--ink)',
        borderLeft: `8px solid ${getPriorityColor()}`,
        boxShadow: 'var(--sh-sm)',
        padding: '12px 16px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'background-color 100ms ease, transform 100ms ease',
      }}
      className="ticket-stub-row"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(request);
        }
      }}
    >
      {/* Public ID */}
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px' }}>
        {request.publicId}
      </div>

      {/* Main info */}
      <div>
        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>
          {request.title} — <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{request.locationBlock}, {request.locationRoom}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink-2)', marginTop: '2px' }}>
          {request.departmentName || 'Department'} · Raised by {request.requesterName || 'Student'}
        </div>
      </div>

      {/* Priority */}
      <div>
        <PriorityBadge priority={request.priority} />
      </div>

      {/* Status */}
      <div>
        <StatusChip status={request.status} />
      </div>

      {/* SLA Timer / Stamp */}
      <div style={{ textAlign: 'right' }}>
        {sla && sla.breached ? (
          <span
            style={{
              display: 'inline-block',
              transform: 'rotate(-3deg)',
              backgroundColor: 'var(--brick)',
              color: 'var(--paper)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              textTransform: 'uppercase',
            }}
          >
            {sla.text}
          </span>
        ) : sla ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 600,
              color: sla.atRisk ? 'var(--brick)' : 'var(--ink)',
              backgroundColor: sla.atRisk ? 'var(--amber)' : 'transparent',
              padding: sla.atRisk ? '2px 4px' : '0',
            }}
          >
            {sla.text}
          </span>
        ) : (
          <span style={{ color: 'var(--ink-3)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>—</span>
        )}
      </div>
    </div>
  );
};
