import React, { useState, useMemo } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isHeadOrAdmin =
    currentUser?.role === 'DEPARTMENT_HEAD' || currentUser?.role === 'ADMIN';

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (filteredRequests: ServiceRequest[]) => {
    if (selectedIds.size === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map((r) => r.id)));
    }
  };

  const handleBulkReassign = () => {
    if (selectedIds.size === 0) return;
    alert(`Reassigned ${selectedIds.size} request(s) to ${targetTech}`);
    setSelectedIds(new Set());
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchId = r.publicId.toLowerCase().includes(q);
        const matchLoc = `${r.locationBlock} ${r.locationRoom}`.toLowerCase().includes(q);
        const matchTech = (r.assigneeName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchLoc && !matchTech) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      ALL: requests.length,
      OPEN: requests.filter((r) => r.status === 'OPEN').length,
      ASSIGNED: requests.filter((r) => r.status === 'ASSIGNED').length,
      IN_PROGRESS: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      ON_HOLD: requests.filter((r) => r.status === 'ON_HOLD' || r.status === 'NEEDS_INFO').length,
      RESOLVED: requests.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length,
    };
  }, [requests]);

  const filterTabs: Array<{ id: 'ALL' | RequestStatus; label: string; count: number }> = [
    { id: 'ALL', label: 'All', count: statusCounts.ALL },
    { id: 'OPEN', label: 'Open', count: statusCounts.OPEN },
    { id: 'ASSIGNED', label: 'Assigned', count: statusCounts.ASSIGNED },
    { id: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS },
    { id: 'ON_HOLD', label: 'On Hold', count: statusCounts.ON_HOLD },
    { id: 'RESOLVED', label: 'Resolved', count: statusCounts.RESOLVED },
  ];

  return (
    <div className="w-full bg-surface text-on-surface">
      {/* Masthead */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
              Department Queue
            </h1>
            <p className="font-body-md text-body-md text-secondary m-0 mt-1">
              Review incoming service tickets, monitor response times, and assign specialists.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-code text-label-code px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface">
              {requests.length} Total Tickets
            </span>
            <span className="font-label-code text-label-code px-3 py-1.5 bg-surface text-tertiary border border-outline-variant font-semibold">
              {statusCounts.OPEN} Unassigned
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col gap-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 bg-surface-container-low p-1 border border-outline-variant">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors border-none cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'bg-transparent text-secondary hover:text-on-surface'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[11px] opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search by ID, title, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant px-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface"
            />
          </div>
        </div>

        {/* Bulk Action Bar (when tickets selected) */}
        {isHeadOrAdmin && selectedIds.size > 0 && (
          <div className="bg-surface-container p-3 border border-outline-variant flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                {selectedIds.size} ticket{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-secondary hover:text-on-surface underline bg-transparent border-none cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary uppercase font-label-caption">Assign to:</span>
              <select
                value={targetTech}
                onChange={(e) => setTargetTech(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-2.5 py-1 text-xs text-on-surface focus:outline-none"
              >
                <option value="Ramesh Kumar">Ramesh Kumar (HVAC)</option>
                <option value="Vikram Singh">Vikram Singh (Electrical)</option>
                <option value="Deepak Rao">Deepak Rao (Plumbing)</option>
              </select>
              <button
                onClick={handleBulkReassign}
                className="px-3 py-1 bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors border-none cursor-pointer"
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {/* Requests Table */}
        <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-secondary font-body-md">
              No requests found matching the current filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-secondary font-semibold uppercase tracking-wider">
                  {isHeadOrAdmin && (
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                        onChange={() => handleSelectAll(filteredRequests)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="p-3 w-32 font-label-code">ID</th>
                  <th className="p-3">Title &amp; Location</th>
                  <th className="p-3 w-28">Status</th>
                  <th className="p-3 w-24">Priority</th>
                  <th className="p-3 w-40">Assigned To</th>
                  <th className="p-3 w-32">SLA Target</th>
                  <th className="p-3 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredRequests.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        isSelected ? 'bg-surface-container-high' : ''
                      }`}
                    >
                      {isHeadOrAdmin && (
                        <td className="p-3 text-center">
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
                        <div className="font-title-sm text-title-sm text-on-surface font-medium">
                          {r.title}
                        </div>
                        <div className="text-xs text-secondary mt-0.5">
                          Block {r.locationBlock} · Room {r.locationRoom}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-label-stamp text-xs px-2 py-0.5 bg-surface-container text-on-surface border border-outline-variant">
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-label-stamp text-xs px-2 py-0.5 border border-outline-variant font-bold ${
                            r.priority === 'P1'
                              ? 'bg-primary text-on-primary'
                              : r.priority === 'P2'
                              ? 'bg-surface-container-highest text-primary'
                              : 'bg-surface-container text-secondary'
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="p-3 text-secondary">
                        {r.assigneeName ? (
                          <span className="text-on-surface font-medium">{r.assigneeName}</span>
                        ) : (
                          <span className="italic text-secondary">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 font-label-code text-xs">
                        {r.slaBreached ? (
                          <span className="text-error font-bold">Breached</span>
                        ) : r.resolveBy ? (
                          <span className="text-tertiary">
                            {new Date(r.resolveBy).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onSelectRequest(r)}
                          className="px-2.5 py-1 bg-surface hover:bg-surface-container text-on-surface border border-outline-variant text-xs font-semibold transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentQueueScreen;
