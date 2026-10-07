import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ServiceRequest } from '../types/api';
import { TicketStubRow } from '../components/TicketStubRow';

interface MyRequestsScreenProps {
  requests: ServiceRequest[];
  onSelectRequest: (request: ServiceRequest) => void;
  onRaiseRequest: () => void;
  loading?: boolean;
}

export const MyRequestsScreen: React.FC<MyRequestsScreenProps> = ({
  requests,
  onSelectRequest,
  onRaiseRequest,
  loading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    return true;
  });

  const statusOptions = ['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const priorityOptions = ['ALL', 'P1', 'P2', 'P3', 'P4'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '32px', color: 'var(--ink)', marginBottom: '6px' }}>
            MY SERVICE REQUESTS
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
            Track resolution status, assigned technicians, and SLA countdowns for your active tickets.
          </p>
        </div>
        <button
          onClick={onRaiseRequest}
          className="btn-brutalist btn-primary"
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          <Plus size={16} />
          RAISE REQUEST
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          backgroundColor: 'var(--card)',
          border: 'var(--bw) solid var(--ink)',
          boxShadow: 'var(--sh-sm)',
          padding: '12px 18px',
          marginBottom: '24px',
        }}
      >
        {/* Status filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink-2)',
              textTransform: 'uppercase',
            }}
          >
            STATUS:
          </span>
          {statusOptions.map((opt) => {
            const active = statusFilter === opt;
            return (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className="stamp-chip"
                style={{
                  backgroundColor: active ? 'var(--ink)' : 'var(--paper-2)',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  cursor: 'pointer',
                  border: 'var(--bw) solid var(--ink)',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Priority filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--ink-2)',
              textTransform: 'uppercase',
            }}
          >
            PRIORITY:
          </span>
          {priorityOptions.map((opt) => {
            const active = priorityFilter === opt;
            return (
              <button
                key={opt}
                onClick={() => setPriorityFilter(opt)}
                className="stamp-chip"
                style={{
                  backgroundColor: active ? 'var(--ink)' : 'var(--paper-2)',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  cursor: 'pointer',
                  border: 'var(--bw) solid var(--ink)',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* List of ticket-stub rows */}
      {loading ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            border: 'var(--bw) solid var(--ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
          }}
        >
          Loading requests
        </div>
      ) : filteredRequests.length === 0 ? (
        <div
          style={{
            padding: '64px 32px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            border: 'var(--bw) solid var(--ink)',
            boxShadow: 'var(--sh-md)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: '16px',
            }}
          >
            No requests yet. Raise one when something breaks.
          </div>
          <button
            onClick={onRaiseRequest}
            className="btn-brutalist btn-primary"
            style={{ padding: '8px 16px' }}
          >
            <Plus size={14} />
            RAISE FIRST REQUEST
          </button>
        </div>
      ) : (
        <div>
          {filteredRequests.map((req) => (
            <TicketStubRow
              key={req.id}
              request={req}
              onClick={onSelectRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};
