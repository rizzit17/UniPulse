import React, { useState } from 'react';
import { RequestStatus, ServiceRequest, User } from '../types/api';

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

  const statusGroups: Array<{ status: RequestStatus; title: string; items: ServiceRequest[] }> = [
    {
      status: 'OPEN',
      title: '01 // UNASSIGNED / OPEN QUEUE',
      items: requests.filter((r) => r.status === 'OPEN'),
    },
    {
      status: 'ASSIGNED',
      title: '02 // ASSIGNED — PENDING WORK INITIATION',
      items: requests.filter((r) => r.status === 'ASSIGNED'),
    },
    {
      status: 'IN_PROGRESS',
      title: '03 // IN PROGRESS — ACTIVE WORK',
      items: requests.filter((r) => r.status === 'IN_PROGRESS'),
    },
    {
      status: 'ON_HOLD',
      title: '04 // ON HOLD / NEEDS INFO — PAUSED',
      items: requests.filter((r) => r.status === 'ON_HOLD' || r.status === 'NEEDS_INFO'),
    },
    {
      status: 'RESOLVED',
      title: '05 // RESOLVED — PENDING CLOSURE',
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
    <div className="w-full bg-surface text-on-surface">
      {/* Masthead */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-space-md px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
          <div>
            <div className="flex items-center gap-space-xs font-label-stamp text-label-stamp text-secondary uppercase tracking-widest mb-1">
              <span>DISPATCH &amp; TRIAGE REGISTER</span>
              <span>·</span>
              <span className="text-primary font-semibold">SEC-03 DEPT OPS</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 leading-tight">
              Department Queue &amp; Triage Ledger
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant m-0 mt-1">
              Grouped operational records ordered strictly by trade priority and remaining SLA budget.
            </p>
          </div>
          <div className="font-label-code text-label-code text-secondary bg-surface px-3 py-1.5 border border-outline-variant">
            ACTIVE CAPACITY: <span className="text-tertiary font-bold">12 SPECIALISTS READY</span>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 py-space-xl flex flex-col gap-space-lg">
        {/* Bulk Action Toolbar for Department Heads / Admins */}
        {isHeadOrAdmin && (
          <div className="bg-surface-container-low border border-outline-variant p-space-md flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <span className="font-label-stamp text-label-stamp font-bold text-on-surface uppercase tracking-wider">
                SELECTED: {selectedIds.size} DOCKETS
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="font-label-code text-label-code text-secondary hover:text-on-surface underline bg-transparent border-none cursor-pointer p-0"
                >
                  CLEAR SELECTION
                </button>
              )}
            </div>

            <div className="flex items-center gap-space-sm flex-wrap">
              <label className="font-label-caption text-label-caption text-secondary uppercase">
                REASSIGN TO:
              </label>
              <select
                value={targetTech}
                onChange={(e) => setTargetTech(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:outline-none"
              >
                <option value="Ramesh Kumar">Ramesh Kumar (Lead HVAC)</option>
                <option value="Vikram Singh">Vikram Singh (Electrical Gr-II)</option>
                <option value="Deepak Rao">Deepak Rao (Civil / Plant)</option>
              </select>
              <button
                disabled={selectedIds.size === 0}
                onClick={handleBulkReassign}
                className="px-space-md py-1.5 bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors font-title-sm text-title-sm font-semibold border-none cursor-pointer"
              >
                APPLY REASSIGN
              </button>
            </div>
          </div>
        )}

        {/* Grouped Status Sections */}
        <div className="flex flex-col gap-space-xl">
          {statusGroups.map((group) => {
            if (group.items.length === 0) return null;
            return (
              <div key={group.status} className="border border-outline-variant bg-surface-container-lowest">
                {/* Group Header */}
                <div className="bg-surface-container-low px-space-md py-space-sm border-b border-outline-variant flex items-center justify-between">
                  <div className="font-label-stamp text-label-stamp text-on-surface font-semibold tracking-wider">
                    {group.title}
                  </div>
                  <span className="font-label-code text-label-code bg-surface text-secondary px-2 py-0.5 border border-outline-variant">
                    {group.items.length} DOCKETS
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-body-sm text-body-sm">
                    <thead>
                      <tr className="bg-surface-container-lowest border-b border-outline-variant font-label-code text-label-code text-secondary">
                        {isHeadOrAdmin && <th className="p-3 w-10"></th>}
                        <th className="p-3 w-36">DOCKET ID</th>
                        <th className="p-3">INCIDENT TITLE &amp; LOCATION</th>
                        <th className="p-3 w-28">PRIORITY</th>
                        <th className="p-3 w-40">SPECIALIST</th>
                        <th className="p-3 w-32">SLA TARGET</th>
                        <th className="p-3 w-24 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {group.items.map((r) => {
                        const isSelected = selectedIds.has(r.id);
                        return (
                          <tr
                            key={r.id}
                            className={`hover:bg-surface-container-low transition-colors ${
                              isSelected ? 'bg-surface-container-high' : ''
                            }`}
                          >
                            {isHeadOrAdmin && (
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(r.id)}
                                  className="w-4 h-4 accent-primary cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="p-3 font-label-code text-label-code font-bold text-on-surface">
                              {r.publicId}
                            </td>
                            <td className="p-3">
                              <div className="font-title-sm text-title-sm text-on-surface">{r.title}</div>
                              <div className="font-label-code text-label-code text-secondary">
                                BLK-{r.locationBlock} · RM-{r.locationRoom}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`font-label-stamp text-label-stamp px-1.5 py-0.5 border border-outline-variant ${
                                  r.priority === 'P1'
                                    ? 'bg-primary text-on-primary font-bold'
                                    : r.priority === 'P2'
                                    ? 'bg-surface-container-highest text-primary font-semibold'
                                    : 'bg-surface-container text-secondary'
                                }`}
                              >
                                [{r.priority}]
                              </span>
                            </td>
                            <td className="p-3 font-body-sm text-body-sm">
                              {r.assigneeName ? (
                                <span className="text-on-surface font-medium">{r.assigneeName}</span>
                              ) : (
                                <span className="font-label-stamp text-label-stamp text-secondary">[UNASSIGNED]</span>
                              )}
                            </td>
                            <td className="p-3 font-label-code text-label-code">
                              {r.slaBreached ? (
                                <span className="text-error font-bold">[BREACHED]</span>
                              ) : r.resolveBy ? (
                                <span className="text-tertiary">
                                  {new Date(r.resolveBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-secondary">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => onSelectRequest(r)}
                                className="px-3 py-1 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-title-sm text-title-sm transition-colors cursor-pointer"
                              >
                                INSPECT
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DepartmentQueueScreen;
