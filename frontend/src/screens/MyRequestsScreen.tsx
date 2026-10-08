import React, { useState } from 'react';
import { ServiceRequest, RequestStatus, RequestPriority } from '../types/api';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [density, setDensity] = useState<'normal' | 'compact'>('normal');

  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const actionRequiredCount = requests.filter((r) => r.status === 'OPEN' || r.status === 'NEEDS_INFO').length;
  const breachedCount = requests.filter((r) => r.slaBreached).length;
  const resolvedCount = requests.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length;

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_PROGRESS' && !(r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED')) return false;
      if (statusFilter === 'OPEN' && !(r.status === 'OPEN' || r.status === 'NEEDS_INFO')) return false;
      if (statusFilter === 'ON_HOLD' && r.status !== 'ON_HOLD') return false;
      if (statusFilter === 'RESOLVED' && !(r.status === 'RESOLVED' || r.status === 'CLOSED')) return false;
    }
    if (deptFilter !== 'ALL') {
      const lowerDept = (r.departmentName || '').toLowerCase();
      if (!lowerDept.includes(deptFilter.toLowerCase())) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.publicId.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.locationBlock.toLowerCase().includes(q) ||
        r.locationRoom.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case 'P1':
        return <span className="font-label-stamp text-label-stamp text-error border border-error px-1.5 py-0.5 bg-error-container/40 leading-none">[P1] CRITICAL</span>;
      case 'P2':
        return <span className="font-label-stamp text-label-stamp text-primary border border-primary px-1.5 py-0.5 bg-primary-fixed/40 leading-none">[P2] HIGH</span>;
      case 'P3':
        return <span className="font-label-stamp text-label-stamp text-secondary border border-outline px-1.5 py-0.5 bg-surface-container leading-none">[P3] MEDIUM</span>;
      case 'P4':
      default:
        return <span className="font-label-stamp text-label-stamp text-secondary border border-outline px-1.5 py-0.5 leading-none">[P4] LOW</span>;
    }
  };

  const getStatusStamp = (status: RequestStatus, slaBreached?: boolean) => {
    if (slaBreached) {
      return (
        <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-error-container text-error font-semibold flex items-center gap-1 border border-error/30">
          <span className="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>
          [!] BREACHED
        </span>
      );
    }

    switch (status) {
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container text-tertiary font-semibold flex items-center gap-1 border border-tertiary/30">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block"></span>
            [*] IN PROGRESS
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container text-tertiary font-semibold flex items-center gap-1 border border-tertiary/30">
            [✔] RESOLVED
          </span>
        );
      case 'ON_HOLD':
      case 'NEEDS_INFO':
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-high text-secondary border border-outline-variant">
            [⏸] ON HOLD
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-low text-on-surface border border-outline-variant">
            [●] OPEN
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col text-on-surface">
      {/* TOP MASTHEAD & KPI STRIP */}
      <section className="w-full bg-surface-container-low px-4 sm:px-8 lg:px-12 py-6 flex flex-col gap-6 border-b border-outline-variant">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-label-stamp text-label-stamp uppercase tracking-widest text-primary font-semibold">
                [STUDENT REPOSITORY]
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <span className="font-label-code text-label-code text-secondary">
                CENTRAL DISPATCH MANIFEST · 2026.04
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-normal">
              My Requests
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Tracking {requests.length} active service incidents across Academic &amp; Residential campus sectors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-surface-container text-on-surface font-title-sm text-title-sm px-4 py-2.5 flex items-center gap-1.5 hover:bg-surface-container-highest transition-colors border border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Ledger</span>
            </button>
            <button
              onClick={onRaiseRequest}
              className="bg-primary text-on-primary font-title-sm text-title-sm px-6 py-2.5 flex items-center gap-1.5 hover:bg-primary-container transition-colors tracking-wide border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="uppercase text-[13px] tracking-wider font-semibold">Raise New Request</span>
            </button>
          </div>
        </div>

        {/* TACTILE KPI METRIC STRIP */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="bg-surface p-4 flex flex-col justify-between border border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-widest">
              Total Filed
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg font-normal text-on-surface">
                {requests.length < 10 ? `0${requests.length}` : requests.length}
              </span>
              <span className="font-label-code text-label-code text-secondary">100% Volume</span>
            </div>
          </div>

          <div className="bg-surface p-4 flex flex-col justify-between border border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-primary uppercase tracking-widest">
              In Progress
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg font-normal text-primary">
                {inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}
              </span>
              <span className="font-label-code text-label-code text-primary-container font-semibold">
                Active Ops
              </span>
            </div>
          </div>

          <div className="bg-surface p-4 flex flex-col justify-between border border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-on-surface uppercase tracking-widest">
              Action Required
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg font-normal text-on-surface">
                {actionRequiredCount < 10 ? `0${actionRequiredCount}` : actionRequiredCount}
              </span>
              <span className="font-label-code text-label-code text-on-surface-variant">Sign-off pending</span>
            </div>
          </div>

          <div className="bg-surface p-4 flex flex-col justify-between border border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-error uppercase tracking-widest">
              Breached SLA
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg font-normal text-error">
                {breachedCount < 10 ? `0${breachedCount}` : breachedCount}
              </span>
              <span className="font-label-code text-label-code text-error font-semibold">Escalated</span>
            </div>
          </div>

          <div className="bg-surface p-4 flex flex-col justify-between border border-outline-variant">
            <span className="font-label-stamp text-label-stamp text-tertiary uppercase tracking-widest">
              Resolved
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg font-normal text-tertiary">
                {resolvedCount < 10 ? `0${resolvedCount}` : resolvedCount}
              </span>
              <span className="font-label-code text-label-code text-tertiary font-semibold">Closed</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUERY FILTER DECK */}
      <section className="w-full bg-surface px-4 sm:px-8 lg:px-12 py-4 flex flex-col gap-3 border-b border-outline-variant">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Monospace Search Input */}
          <div className="flex-1 relative flex items-center bg-surface-container-low max-w-xl border border-outline-variant">
            <span className="material-symbols-outlined text-secondary ml-3 text-[20px]">search</span>
            <input
              id="ledger-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, block, or room code..."
              className="w-full bg-transparent px-3 py-2 text-body-md font-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest"
            />
            <div className="pr-3 hidden sm:flex items-center gap-1 text-secondary font-label-code text-[10px]">
              <kbd className="bg-surface-container px-1 py-0.5 border border-outline-variant">⌘</kbd>
              <kbd className="bg-surface-container px-1 py-0.5 border border-outline-variant">K</kbd>
            </div>
          </div>

          {/* View Controls & Density Toggle */}
          <div className="flex items-center gap-4 self-end lg:self-auto">
            <div className="flex items-center bg-surface-container-low p-0.5 border border-outline-variant">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 font-label-stamp text-label-stamp uppercase flex items-center gap-1.5 transition-colors cursor-pointer border-none ${
                  viewMode === 'table' ? 'bg-surface text-on-surface font-semibold' : 'text-secondary hover:text-on-surface bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_headline</span>
                <span>Ledger Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 font-label-stamp text-label-stamp uppercase flex items-center gap-1.5 transition-colors cursor-pointer border-none ${
                  viewMode === 'card' ? 'bg-surface text-on-surface font-semibold' : 'text-secondary hover:text-on-surface bg-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span>Card Grid</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 border border-outline-variant">
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-2 py-1 font-label-stamp text-label-stamp border-none cursor-pointer ${
                  density === 'compact' ? 'bg-surface text-on-surface font-semibold' : 'text-secondary hover:text-on-surface bg-transparent'
                }`}
              >
                COMPACT
              </button>
              <button
                type="button"
                onClick={() => setDensity('normal')}
                className={`px-2 py-1 font-label-stamp text-label-stamp border-none cursor-pointer ${
                  density === 'normal' ? 'bg-surface text-on-surface font-semibold' : 'text-secondary hover:text-on-surface bg-transparent'
                }`}
              >
                NORMAL
              </button>
            </div>
          </div>
        </div>

        {/* Filter Taxonomy Ribbons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-body-sm font-body-sm">
          <span className="font-label-stamp text-label-stamp text-secondary mr-1 uppercase tracking-wider">
            Status:
          </span>
          {['ALL', 'IN_PROGRESS', 'OPEN', 'ON_HOLD', 'RESOLVED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 font-title-sm text-[12px] border border-outline-variant cursor-pointer ${
                statusFilter === st
                  ? 'bg-surface-container-highest text-on-surface font-semibold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {st === 'ALL' ? `All (${requests.length})` : st.replace('_', ' ')}
            </button>
          ))}

          <span className="w-1.5 h-1.5 rounded-full bg-outline-variant mx-1 hidden sm:inline-block"></span>
          <span className="font-label-stamp text-label-stamp text-secondary mr-1 uppercase tracking-wider">
            Dept:
          </span>
          {['ALL', 'Facilities', 'IT', 'Housing', 'Security'].map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setDeptFilter(dept)}
              className={`px-2.5 py-1 font-label-code text-[11px] border border-outline-variant cursor-pointer ${
                deptFilter === dept
                  ? 'bg-surface-container-highest text-on-surface font-semibold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {dept === 'ALL' ? 'All Sectors' : dept}
            </button>
          ))}
        </div>
      </section>

      {/* WORKSPACE: DATA LEDGER TABLE */}
      <section className="w-full px-4 sm:px-8 lg:px-12 py-8">
        {loading ? (
          <div className="p-12 text-center text-secondary font-label-code">
            <span className="material-symbols-outlined animate-spin text-2xl mb-2">sync</span>
            <div>Loading service requests manifest...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-low border border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-secondary mb-2">inbox</span>
            <div className="font-headline-sm text-headline-sm text-on-surface">No Service Incidents Match Filter</div>
            <p className="font-body-md text-secondary mt-1">Try clearing filters or search query.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="w-full bg-surface-container-lowest border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container text-secondary font-label-stamp text-label-stamp tracking-wider border-b border-outline-variant">
                    <th className="py-3 px-4 font-semibold">TICKET ID</th>
                    <th className="py-3 px-4 font-semibold">INCIDENT SUMMARY &amp; SECTOR</th>
                    <th className="py-3 px-4 font-semibold">LOCATION</th>
                    <th className="py-3 px-4 font-semibold">PRIORITY</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold">SLA COUNTDOWN</th>
                    <th className="py-3 px-4 font-semibold">ASSIGNEE</th>
                    <th className="py-3 px-4 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
                  {filtered.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => onSelectRequest(req)}
                      className={`ticket-row hover:bg-surface-container-low transition-colors cursor-pointer group ${
                        density === 'compact' ? 'py-2' : 'py-3.5'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-label-code text-label-code font-semibold text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                          {req.publicId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-[15px] text-on-surface font-normal group-hover:text-primary transition-colors">
                            {req.title}
                          </span>
                          <span className="font-label-code text-[11px] text-secondary mt-0.5">
                            Sector: {req.departmentName || 'Campus Ops'} · {req.categoryName || 'General'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-on-surface font-label-code text-label-code">
                          <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                          <span>
                            {req.locationBlock} · {req.locationRoom}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getPriorityBadge(req.priority)}</td>

                      <td className="py-3.5 px-4">{getStatusStamp(req.status, req.slaBreached)}</td>

                      <td className="py-3.5 px-4 font-label-code text-label-code">
                        <span className={req.slaBreached ? 'text-error font-semibold' : 'text-primary'}>
                          {req.slaBreached
                            ? 'BREACHED'
                            : req.resolveBy
                            ? `Due ${new Date(req.resolveBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : '2h 14m left'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-title-sm text-title-sm text-on-surface">
                        {req.assigneeName || <span className="text-secondary italic">Auto-Dispatching...</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="font-label-stamp text-label-stamp text-primary bg-primary-fixed/40 hover:bg-primary-fixed px-2.5 py-1 border border-primary/40 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>INSPECT</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className="bg-surface-container-lowest p-5 border border-outline-variant hover:border-primary transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-code text-label-code font-semibold text-primary">
                      {req.publicId}
                    </span>
                    {getPriorityBadge(req.priority)}
                  </div>
                  <h3 className="font-headline-sm text-[16px] text-on-surface font-normal mb-1">
                    {req.title}
                  </h3>
                  <p className="font-body-sm text-secondary line-clamp-2 mb-3">
                    {req.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-1 text-secondary font-label-code text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    <span>{req.locationBlock} · {req.locationRoom}</span>
                  </div>
                  {getStatusStamp(req.status, req.slaBreached)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
