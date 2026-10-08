import React, { useState } from 'react';
import { RequestPriority, RequestStatus, ServiceRequest } from '../types/api';

interface MyRequestsScreenProps {
  requests: ServiceRequest[];
  loading?: boolean;
  onSelectRequest: (request: ServiceRequest) => void;
  onRaiseRequest: () => void;
}

export const MyRequestsScreen: React.FC<MyRequestsScreenProps> = ({
  requests,
  loading = false,
  onSelectRequest,
  onRaiseRequest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const actionRequiredCount = requests.filter((r) => r.status === 'OPEN' || r.status === 'NEEDS_INFO').length;
  const resolvedCount = requests.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length;

  const filtered = requests.filter((r) => {
    if (statusFilter === 'IN_PROGRESS' && !(r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED')) return false;
    if (statusFilter === 'OPEN' && !(r.status === 'OPEN' || r.status === 'NEEDS_INFO')) return false;
    if (statusFilter === 'RESOLVED' && !(r.status === 'RESOLVED' || r.status === 'CLOSED')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.publicId.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchLoc = `${r.locationBlock} ${r.locationRoom}`.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'P1':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-error-container text-error font-semibold">
            P1 CRITICAL
          </span>
        );
      case 'P2':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-highest text-primary font-semibold">
            P2 HIGH
          </span>
        );
      case 'P3':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-high text-on-surface font-medium">
            P3 MEDIUM
          </span>
        );
      default:
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container text-secondary">
            P4 LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: RequestStatus, slaBreached?: boolean) => {
    if (slaBreached) {
      return (
        <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-error text-on-error font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-on-error inline-block"></span>
          BREACHED
        </span>
      );
    }

    switch (status) {
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-high text-primary font-semibold flex items-center gap-1 border border-outline-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-high text-tertiary font-semibold flex items-center gap-1 border border-outline-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block"></span>
            RESOLVED
          </span>
        );
      case 'ON_HOLD':
      case 'NEEDS_INFO':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container text-secondary">
            ON HOLD
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-low text-on-surface border border-outline-variant">
            OPEN
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6 text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
            My Requests
          </h1>
          <p className="font-body-sm text-body-sm text-secondary m-0 mt-1">
            Track and manage your campus facility tickets
          </p>
        </div>

        <button
          onClick={onRaiseRequest}
          className="self-start sm:self-auto px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-title-sm font-semibold transition-colors flex items-center gap-1.5 border-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Request</span>
        </button>
      </div>

      {/* Clean KPI metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest p-4 border border-outline-variant flex flex-col">
          <span className="font-label-caption text-label-caption text-secondary uppercase">Total Tickets</span>
          <span className="font-headline-md text-headline-md font-semibold text-on-surface mt-1">
            {requests.length}
          </span>
        </div>
        <div className="bg-surface-container-lowest p-4 border border-outline-variant flex flex-col">
          <span className="font-label-caption text-label-caption text-secondary uppercase">In Progress</span>
          <span className="font-headline-md text-headline-md font-semibold text-primary mt-1">
            {inProgressCount}
          </span>
        </div>
        <div className="bg-surface-container-lowest p-4 border border-outline-variant flex flex-col">
          <span className="font-label-caption text-label-caption text-secondary uppercase">Resolved</span>
          <span className="font-headline-md text-headline-md font-semibold text-tertiary mt-1">
            {resolvedCount}
          </span>
        </div>
        <div className="bg-surface-container-lowest p-4 border border-outline-variant flex flex-col">
          <span className="font-label-caption text-label-caption text-secondary uppercase">Open / Pending</span>
          <span className="font-headline-md text-headline-md font-semibold text-secondary mt-1">
            {actionRequiredCount}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-2 border border-outline-variant">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest px-3 py-2 border border-outline-variant">
          <span className="material-symbols-outlined text-[18px] text-secondary">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, room..."
            className="w-full bg-transparent border-none outline-none font-body-sm text-body-sm text-on-surface placeholder:text-secondary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-secondary hover:text-on-surface border-none bg-transparent cursor-pointer p-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 font-title-sm text-xs">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 border transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-surface-container-lowest text-on-surface font-semibold border-outline-variant'
                  : 'bg-transparent text-secondary border-transparent hover:text-on-surface'
              }`}
            >
              {tab === 'ALL'
                ? 'All'
                : tab === 'OPEN'
                ? 'Open'
                : tab === 'IN_PROGRESS'
                ? 'In Progress'
                : 'Resolved'}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="hidden sm:flex items-center gap-1 border-l border-outline-variant pl-2">
          <button
            onClick={() => setViewMode('table')}
            title="Table View"
            className={`p-1.5 border transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-surface-container-lowest text-on-surface border-outline-variant'
                : 'bg-transparent text-secondary border-transparent hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
          </button>
          <button
            onClick={() => setViewMode('card')}
            title="Card View"
            className={`p-1.5 border transition-colors cursor-pointer ${
              viewMode === 'card'
                ? 'bg-surface-container-lowest text-on-surface border-outline-variant'
                : 'bg-transparent text-secondary border-transparent hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
          </button>
        </div>
      </div>

      {/* Main List / Table */}
      {loading ? (
        <div className="py-16 text-center text-secondary font-body-sm">
          Loading requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-surface-container-lowest border border-outline-variant flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-secondary">inbox</span>
          <div className="font-title-sm text-title-sm text-on-surface">No service requests found</div>
          <p className="font-body-sm text-body-sm text-secondary m-0 max-w-sm">
            {searchQuery ? 'Try clearing your search or filter terms.' : 'Have an issue on campus? Submit a new request.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onRaiseRequest}
              className="mt-2 px-4 py-2 bg-primary text-on-primary font-title-sm text-xs cursor-pointer border-none"
            >
              Submit New Request
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto">
          <table className="w-full text-left border-collapse font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-caption text-label-caption text-secondary uppercase">
                <th className="py-3 px-4 w-36">ID</th>
                <th className="py-3 px-4">Title &amp; Location</th>
                <th className="py-3 px-4 w-28">Priority</th>
                <th className="py-3 px-4 w-32">Status</th>
                <th className="py-3 px-4 w-32">SLA Target</th>
                <th className="py-3 px-4 w-20 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-label-code text-label-code font-semibold text-on-surface">
                    {req.publicId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-title-sm text-title-sm text-on-surface">{req.title}</div>
                    <div className="font-label-code text-label-code text-secondary text-xs mt-0.5">
                      Block {req.locationBlock} · Room {req.locationRoom}
                    </div>
                  </td>
                  <td className="py-3 px-4">{getPriorityBadge(req.priority)}</td>
                  <td className="py-3 px-4">{getStatusBadge(req.status, req.slaBreached)}</td>
                  <td className="py-3 px-4 font-label-code text-label-code text-xs text-secondary">
                    {req.slaBreached ? (
                      <span className="text-error font-bold">Breached</span>
                    ) : req.resolveBy ? (
                      new Date(req.resolveBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      className="font-title-sm text-xs text-primary hover:underline bg-transparent border-none cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => onSelectRequest(req)}
              className="bg-surface-container-lowest p-5 border border-outline-variant hover:border-primary transition-all cursor-pointer flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-code text-label-code font-semibold text-primary">
                    {req.publicId}
                  </span>
                  {getPriorityBadge(req.priority)}
                </div>
                <h3 className="font-title-sm text-title-sm text-on-surface font-semibold m-0 mb-1">
                  {req.title}
                </h3>
                <p className="font-body-sm text-secondary m-0 line-clamp-2">
                  {req.description}
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-1 text-secondary font-label-code text-xs">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span>Block {req.locationBlock}, Room {req.locationRoom}</span>
                </div>
                {getStatusBadge(req.status, req.slaBreached)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequestsScreen;
