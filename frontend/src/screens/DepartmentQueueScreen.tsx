import React, { useState } from 'react';
import { RequestStatus, ServiceRequest, User } from '../types/api';
import { PriorityBadge } from '../components/PriorityBadge';

interface DepartmentQueueScreenProps {
  requests: ServiceRequest[];
  onSelectRequest: (request: ServiceRequest) => void;
  currentUser: User | null;
}

export const DepartmentQueueScreen: React.FC<DepartmentQueueScreenProps> = ({
  requests,
  onSelectRequest,
  currentUser,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetTech, setTargetTech] = useState<string>('Ramesh Kumar');

  const isHeadOrAdmin =
    currentUser?.role === 'DEPARTMENT_HEAD' || currentUser?.role === 'ADMIN';

  // Group into status buckets per DESIGN.md Kanban-less table
  const statusGroups: Array<{ status: RequestStatus; title: string; items: ServiceRequest[] }> = [
    {
      status: 'OPEN',
      title: '01. UNASSIGNED / OPEN QUEUE',
      items: requests.filter((r) => r.status === 'OPEN'),
    },
    {
      status: 'ASSIGNED',
      title: '02. ASSIGNED — PENDING WORK INITIATION',
      items: requests.filter((r) => r.status === 'ASSIGNED'),
    },
    {
      status: 'IN_PROGRESS',
      title: '03. IN PROGRESS — ACTIVE WORK',
      items: requests.filter((r) => r.status === 'IN_PROGRESS'),
    },
    {
      status: 'ON_HOLD',
      title: '04. ON HOLD / NEEDS INFO — PAUSED',
      items: requests.filter((r) => r.status === 'ON_HOLD' || r.status === 'NEEDS_INFO'),
    },
    {
      status: 'RESOLVED',
      title: '05. RESOLVED — PENDING CLOSURE',
      items: requests.filter((r) => r.status === 'RESOLVED'),
    },
  ];

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkReassign = () => {
    if (selectedIds.size === 0) return;
    alert(`Bulk reassigned ${selectedIds.size} tickets to technician: ${targetTech}`);
    setSelectedIds(new Set());
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--ink)', marginBottom: '6px' }}>
          DEPARTMENT TRIAGE & DISPATCH QUEUE
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
          Kanban-less grouped operations ledger ordered strictly by priority urgency and remaining SLA budget.
        </p>
      </div>

      {/* Bulk action toolbar for Head */}
      {isHeadOrAdmin && (
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: 'var(--bw) solid var(--ink)',
            boxShadow: 'var(--sh-sm)',
            padding: '12px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700 }}>
              SELECTED: {selectedIds.size} TICKETS
            </span>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                CLEAR SELECTION
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              REASSIGN TO:
            </label>
            <select
              value={targetTech}
              onChange={(e) => setTargetTech(e.target.value)}
              className="form-select"
              style={{ width: '180px', height: '34px', fontSize: '12px', padding: '4px 8px' }}
            >
              <option value="Ramesh Kumar">Ramesh Kumar (Tech)</option>
              <option value="Vikram Singh">Vikram Singh (Tech)</option>
              <option value="Deepak Rao">Deepak Rao (Tech)</option>
            </select>
            <button
              disabled={selectedIds.size === 0}
              onClick={handleBulkReassign}
              className="btn-brutalist btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              APPLY REASSIGN
            </button>
          </div>
        </div>
      )}

      {/* Grouped Status Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {statusGroups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <div key={group.status} style={{ border: 'var(--bw) solid var(--ink)', boxShadow: 'var(--sh-md)' }}>
              {/* Sticky Group Header */}
              <div
                style={{
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '12px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {group.title}
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    border: '1px solid var(--paper)',
                  }}
                >
                  {group.items.length} TICKETS
                </div>
              </div>

              {/* Table */}
              <table className="brutalist-table" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    {isHeadOrAdmin && <th style={{ width: '40px' }}></th>}
                    <th style={{ width: '130px' }}>ID</th>
                    <th>TITLE & LOCATION</th>
                    <th style={{ width: '110px' }}>PRIORITY</th>
                    <th style={{ width: '140px' }}>ASSIGNEE</th>
                    <th style={{ width: '140px' }}>SLA TARGET</th>
                    <th style={{ width: '90px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((r) => {
                    const isSelected = selectedIds.has(r.id);
                    return (
                      <tr key={r.id} style={{ backgroundColor: isSelected ? '#FAF5E8' : undefined }}>
                        {isHeadOrAdmin && (
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(r.id)}
                            />
                          </td>
                        )}
                        <td className="mono" style={{ fontWeight: 600 }}>
                          {r.publicId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ink-2)' }}>
                            {r.locationBlock}, {r.locationRoom}
                          </div>
                        </td>
                        <td>
                          <PriorityBadge priority={r.priority} />
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {r.assigneeName || <span style={{ color: 'var(--ink-3)' }}>Unassigned</span>}
                        </td>
                        <td className="mono" style={{ fontSize: '12px' }}>
                          {r.slaBreached ? (
                            <span style={{ color: 'var(--brick)', fontWeight: 700 }}>BREACHED</span>
                          ) : r.resolveBy ? (
                            new Date(r.resolveBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => onSelectRequest(r)}
                            className="btn-brutalist btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};
