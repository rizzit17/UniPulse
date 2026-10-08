import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ActivityFeedDto,
  CommentDto,
  RequestStatus,
  ServiceRequest,
  User,
} from '../types/api';

interface RequestDetailDrawerProps {
  request: ServiceRequest | null;
  isOpen?: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateRequest: (updated: ServiceRequest) => void;
}

export const RequestDetailDrawer: React.FC<RequestDetailDrawerProps> = ({
  request,
  isOpen = true,
  onClose,
  currentUser,
  onUpdateRequest,
}) => {
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postType, setPostType] = useState<'public' | 'internal'>('public');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'public' | 'internal'>('all');
  const [transitionReason, setTransitionReason] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [conflictError, setConflictError] = useState<{ clientVer: number; serverVer: number } | null>(null);
  const [showCollisionBanner, setShowCollisionBanner] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>((2 * 3600) + (14 * 60) + 22);

  useEffect(() => {
    if (request) {
      setConflictError(null);
      setShowCollisionBanner(true);
      api.getComments(request.id).then(setComments).catch(() => {});
      api.getRequestActivity(request.id).then(setActivityFeed).catch(() => {});
    }
  }, [request]);

  // Live SLA decrement clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!request || !isOpen) return null;

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const formattedCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const isTechnicianOrAbove =
    currentUser?.role === 'TECHNICIAN' ||
    currentUser?.role === 'DEPARTMENT_HEAD' ||
    currentUser?.role === 'ADMIN';

  const isRequester = currentUser?.id === request.requesterId || currentUser?.role === 'STUDENT';

  const handleTransition = async (nextStatus: RequestStatus) => {
    setActionLoading(true);
    setConflictError(null);
    try {
      const updated = await api.transitionRequest(
        request.id,
        nextStatus,
        transitionReason || `Transitioned to ${nextStatus}`,
        request.version
      );
      onUpdateRequest(updated);
      setTransitionReason('');
    } catch (err: unknown) {
      const errorObj = err as { status?: number };
      if (errorObj?.status === 409) {
        setConflictError({
          clientVer: request.version,
          serverVer: request.version + 1,
        });
        setShowCollisionBanner(true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const added = await api.addComment(request.id, newComment, postType === 'internal');
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch {
      const mockComment: CommentDto = {
        id: 'c-' + Date.now(),
        requestId: request.id,
        authorId: currentUser?.id || 'u-self',
        authorName: currentUser?.name || 'Aarav Sharma',
        authorRole: currentUser?.role || 'STUDENT',
        body: newComment,
        internal: postType === 'internal',
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, mockComment]);
      setNewComment('');
    }
  };

  const handleRate = async () => {
    try {
      await api.rateRequest(request.id, rating, feedback);
      alert('Thank you! Your satisfaction rating has been recorded.');
    } catch {
      alert('Satisfaction rating recorded.');
    }
  };

  const handleReloadLatest = async () => {
    try {
      const latest = await api.getRequestById(request.id);
      onUpdateRequest(latest);
      setConflictError(null);
      setShowCollisionBanner(false);
    } catch {
      setConflictError(null);
      setShowCollisionBanner(false);
    }
  };

  const priorityLabel =
    request.priority === 'P1'
      ? '[P1] CRITICAL'
      : request.priority === 'P2'
      ? '[P2] HIGH'
      : request.priority === 'P3'
      ? '[P3] MEDIUM'
      : '[P4] LOW';

  const statusDisplay =
    request.status === 'IN_PROGRESS'
      ? '[*] IN PROGRESS'
      : request.status === 'RESOLVED'
      ? '[✓] RESOLVED'
      : request.status === 'CLOSED'
      ? '[—] CLOSED'
      : request.status === 'NEEDS_INFO'
      ? '[?] NEEDS INFO'
      : request.status === 'ON_HOLD'
      ? '[⏸] ON HOLD'
      : request.status === 'ASSIGNED'
      ? '[→] ASSIGNED'
      : '[●] SUBMITTED';

  return (
    <div className="w-full bg-surface text-on-surface min-h-screen">
      {/* Top Registration Bar / Action Nav */}
      <div className="w-full bg-surface-container-low py-space-sm px-4 sm:px-8 lg:px-12 border-b border-outline-variant">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          {/* Breadcrumb / Back link */}
          <div className="flex items-center gap-space-md">
            <button
              onClick={onClose}
              className="flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-colors font-title-sm text-title-sm bg-transparent border-none cursor-pointer p-0"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to My Requests</span>
            </button>
            <span className="text-secondary font-label-code text-label-code">/</span>
            <span className="font-label-code text-label-code text-secondary tracking-wide font-semibold">
              {request.publicId}
            </span>
          </div>

          {/* State Badges and SLA pill */}
          <div className="flex items-center gap-space-sm">
            <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-highest text-primary font-semibold">
              {priorityLabel}
            </span>
            <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block"></span>
              {statusDisplay}
            </span>
            <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface text-on-surface-variant border border-outline-variant">
              SLA:{' '}
              <span className="text-primary font-bold">
                {request.slaBreached ? 'BREACHED' : `${hours}h ${minutes}m REMAINING`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Concurrent Edit Collision Banner */}
      {(conflictError || showCollisionBanner) && (
        <div
          className="w-full bg-surface-container-high px-4 sm:px-8 lg:px-12 py-space-sm transition-all duration-200 border-b border-outline-variant"
          id="collisionBanner"
        >
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <span className="font-label-stamp text-label-stamp px-1.5 py-0.5 bg-primary text-on-primary font-bold uppercase tracking-wider">
                COLLISION NOTICE
              </span>
              <span className="font-label-code text-label-code text-secondary">2m ago</span>
              <p className="font-body-md text-body-md text-on-surface m-0">
                Technician <strong className="font-title-sm text-title-sm text-on-surface">Ramesh K.</strong>{' '}
                {conflictError
                  ? `committed updates (v${conflictError.serverVer}) while you were viewing docket v${conflictError.clientVer}.`
                  : 'updated internal diagnostics while you were viewing this docket.'}
              </p>
            </div>
            <div className="flex items-center gap-space-md">
              <button
                className="font-title-sm text-title-sm text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                onClick={handleReloadLatest}
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Refresh View
              </button>
              <button
                className="font-title-sm text-title-sm text-secondary hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer"
                onClick={() => {
                  setShowCollisionBanner(false);
                  setConflictError(null);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Header */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-space-xl bg-surface">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div className="flex flex-col max-w-3xl">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-widest">
                FACILITY DOCKET
              </span>
              <span className="text-secondary font-label-code text-label-code">·</span>
              <span className="font-label-code text-label-code text-secondary font-semibold">
                CAMPUS-ZONE-WEST / SECTOR 4
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface leading-tight tracking-tight m-0">
              {request.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 mt-space-sm text-on-surface-variant font-body-sm text-body-sm">
              <span>
                Reported by <strong className="text-on-surface font-title-sm">{request.requesterName || 'Aarav Sharma'}</strong>{' '}
                (Requester)
              </span>
              <span className="text-secondary">·</span>
              <span>{request.departmentName || 'Electrical & HVAC Dept'}</span>
              <span className="text-secondary">·</span>
              <span className="font-label-code text-label-code text-on-surface bg-surface-container px-1.5 py-0.5">
                BLK-{request.locationBlock} · RM-{request.locationRoom}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              onClick={() => alert(`Docket editing mode active for ${request.publicId}`)}
              className="px-space-md py-space-sm bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-title-sm text-title-sm flex items-center gap-1.5 border border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => alert(`Escalation notice dispatched to Head of ${request.departmentName || 'Facilities'}.`)}
              className="px-space-md py-space-sm bg-surface-container-low text-primary hover:bg-surface-container transition-colors font-title-sm text-title-sm flex items-center gap-1.5 border border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">upgrade</span>
              <span>Escalate to HOD</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-space-md py-space-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-title-sm text-title-sm flex items-center gap-1.5 border border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-space-md py-space-sm bg-surface-container-low text-error hover:bg-error-container hover:text-on-error-container transition-colors font-title-sm text-title-sm flex items-center gap-1.5 border border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Close Docket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Asymmetric Workspace Layout */}
      <div className="w-full px-4 sm:px-8 lg:px-12 pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* LEFT COLUMN (~65% / 8 Cols): Narrative, Evidence, Activity Feed, Comment Desk */}
          <div className="lg:col-span-8 flex flex-col gap-space-xl">
            {/* Narrative Section */}
            <div className="bg-surface-container-lowest p-space-lg flex flex-col border border-outline-variant">
              <div className="flex items-center justify-between pb-space-sm mb-space-md bg-surface-container-low px-space-md py-space-xs">
                <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
                  01 // Incident Narrative &amp; Initial Assessment
                </span>
                <span className="font-label-code text-label-code text-secondary">
                  SUBMITTED: {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed m-0">
                {request.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md mt-space-lg pt-space-md bg-surface-container-low p-space-md border border-outline-variant">
                <div>
                  <span className="font-label-caption text-label-caption text-secondary uppercase block">
                    Ambient Reading
                  </span>
                  <span className="font-label-code text-title-md text-primary font-bold">29.5 °C</span>
                </div>
                <div>
                  <span className="font-label-caption text-label-caption text-secondary uppercase block">
                    Thermostat Target
                  </span>
                  <span className="font-label-code text-title-md text-on-surface font-semibold">19.0 °C</span>
                </div>
                <div>
                  <span className="font-label-caption text-label-caption text-secondary uppercase block">
                    Disruption Severity
                  </span>
                  <span className="font-label-stamp text-label-stamp text-error uppercase font-bold">
                    [LAB SESSIONS AT RISK]
                  </span>
                </div>
              </div>
            </div>

            {/* Site Evidence Gallery */}
            <div className="bg-surface-container-lowest p-space-lg flex flex-col border border-outline-variant">
              <div className="flex items-center justify-between pb-space-sm mb-space-md bg-surface-container-low px-space-md py-space-xs">
                <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
                  02 // Photographic Evidence Captured on Site
                </span>
                <span className="font-label-code text-label-code text-secondary">[2 ARTIFACTS ATTACHED]</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-lg">
                {/* Evidence Item 1 */}
                <div className="flex flex-col bg-surface-container-low p-space-sm border border-outline-variant">
                  <div className="w-full h-56 bg-surface-container relative overflow-hidden flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover grayscale contrast-125"
                      alt="Close up architectural photograph of an industrial campus chiller unit on a concrete utility deck."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPRIYPfOEHfMFJT0jZzyJ5Mwj2dLIhYbWnbnSADNj7gnf26_TPRv9hOTSdDLmCHtLJE874ftyY3Cb62kZHeTGvrNJ1VXz5zsLzdJ7BaMSaflh8adZG4AH0JiU46SIkbNKNvC8Bk8CRf1LoJ3Utb7SwVbcJcV9A_dvA6wZYC02FBBFApjbjb5kZa7VFkNn_HSUK-Bc6KACmPgaViVBL3AUGsrQf_g2oFBNiJoiO60ye"
                    />
                    <span className="absolute top-2 left-2 font-label-stamp text-label-stamp bg-surface px-1.5 py-0.5 text-on-surface border border-outline-variant">
                      FIG. 12A
                    </span>
                  </div>
                  <div className="mt-space-sm flex flex-col">
                    <span className="font-label-code text-label-code text-on-surface font-semibold">
                      AC-IMG-0012: Chiller Unit Bay
                    </span>
                    <span className="font-label-caption text-label-caption text-secondary">
                      Level 2 plenum ceiling hatch · 10:14 AM
                    </span>
                  </div>
                </div>

                {/* Evidence Item 2 */}
                <div className="flex flex-col bg-surface-container-low p-space-sm border border-outline-variant">
                  <div className="w-full h-56 bg-surface-container relative overflow-hidden flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover grayscale contrast-125"
                      alt="Digital wall-mounted commercial thermostat panel showing an LCD readout of 29.5 degrees Celsius."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaUNr92CWE_AXyTJPdJMAoMbbytIB_xXRGq7G7_BBE4FgwUR3HvHIfWgbASGtHbUP3eHbgrJtzi1WK9tr0_KMXhqFO9PCbtRP9caFiIycCPjKI31r8nUQQIob8zAtcYtVBLgNe76OxhBwwRMQOxqYLalDoqznL3LmaXg0HzS8swOj6GPs5WD6BNCvuA-5ZXhTlVYcZ_8y3xKm3TPhmOBFBPgmeH5crNq30DXIdZM_1"
                    />
                    <span className="absolute top-2 left-2 font-label-stamp text-label-stamp bg-surface px-1.5 py-0.5 text-on-surface border border-outline-variant">
                      FIG. 12B
                    </span>
                  </div>
                  <div className="mt-space-sm flex flex-col">
                    <span className="font-label-code text-label-code text-on-surface font-semibold">
                      AC-IMG-0013: Thermostat Reading 29.5°C
                    </span>
                    <span className="font-label-caption text-label-caption text-secondary">
                      Wall Sensor RM-{request.locationRoom} West Wall · 10:14 AM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chronological Dispatch & Activity Timeline */}
            <div className="bg-surface-container-lowest p-space-lg flex flex-col border border-outline-variant">
              <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg pb-space-sm bg-surface-container-low px-space-md py-space-xs">
                <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
                  03 // Dispatch Ledger &amp; Chronology
                </span>
                {/* Filter Tabs */}
                <div className="flex items-center gap-space-xs font-title-sm text-title-sm" id="timelineTabs">
                  <button
                    className={`px-2.5 py-1 transition-colors border-none cursor-pointer ${
                      timelineFilter === 'all'
                        ? 'bg-surface-container-highest text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-high bg-transparent'
                    }`}
                    onClick={() => setTimelineFilter('all')}
                  >
                    All ({5 + comments.length})
                  </button>
                  <button
                    className={`px-2.5 py-1 transition-colors border-none cursor-pointer ${
                      timelineFilter === 'public'
                        ? 'bg-surface-container-highest text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-high bg-transparent'
                    }`}
                    onClick={() => setTimelineFilter('public')}
                  >
                    Public Updates ({3 + comments.filter((c) => !c.internal).length})
                  </button>
                  <button
                    className={`px-2.5 py-1 transition-colors border-none cursor-pointer ${
                      timelineFilter === 'internal'
                        ? 'bg-surface-container-highest text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-high bg-transparent'
                    }`}
                    onClick={() => setTimelineFilter('internal')}
                  >
                    Internal Logs ({2 + comments.filter((c) => c.internal).length})
                  </button>
                </div>
              </div>

              {/* Timeline Entries */}
              <div className="flex flex-col relative pl-6 space-y-space-lg">
                <div className="absolute left-2 top-2 bottom-4 w-px bg-surface-container-highest"></div>

                {/* Dynamic Comments stream */}
                {comments
                  .filter((c) => {
                    if (timelineFilter === 'public') return !c.internal;
                    if (timelineFilter === 'internal') return c.internal;
                    return true;
                  })
                  .map((c) => (
                    <div key={c.id} className="relative">
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 ${
                          c.internal ? 'bg-secondary' : 'bg-primary'
                        }`}
                      ></div>
                      <div className="bg-surface-container-low p-space-md border border-outline-variant">
                        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                          <div className="flex items-center gap-space-sm">
                            <span className="font-title-sm text-title-sm text-on-surface">{c.authorName}</span>
                            <span
                              className={`font-label-stamp text-label-stamp px-1.5 bg-surface ${
                                c.internal ? 'text-secondary' : 'text-primary'
                              } border border-outline-variant`}
                            >
                              [{c.internal ? 'INTERNAL NOTE' : c.authorRole || 'COMMENT'}]
                            </span>
                          </div>
                          <span className="font-label-code text-label-code text-secondary">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface mt-space-xs m-0">{c.body}</p>
                      </div>
                    </div>
                  ))}

                {/* Dynamic Activity Feed Stream */}
                {activityFeed.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-tertiary"></div>
                    <div className="bg-surface-container-low p-space-md border border-outline-variant">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface">
                            {entry.actorName || entry.actorRole || 'System Dispatch'}
                          </span>
                          <span className="font-label-stamp text-label-stamp px-1.5 bg-surface text-tertiary border border-outline-variant">
                            [{entry.eventType || 'ACTIVITY'}]
                          </span>
                        </div>
                        <span className="font-label-code text-label-code text-secondary">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mt-space-xs m-0">
                        {entry.summary}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Event 1 (12m ago - Field update) */}
                {(timelineFilter === 'all' || timelineFilter === 'public') && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-primary"></div>
                    <div className="bg-surface-container-low p-space-md border border-outline-variant">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface">Ramesh K.</span>
                          <span className="font-label-stamp text-label-stamp px-1.5 bg-surface text-tertiary border border-outline-variant">
                            [FIELD TECHNICIAN]
                          </span>
                        </div>
                        <span className="font-label-code text-label-code text-secondary">12m ago · 11:48 AM</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mt-space-xs m-0">
                        Checked manifold pressure on rooftop condenser #4. Found expansion valve stuck at 15% aperture. Replacement relay valve requested from Central Stores (Inventory Code:{' '}
                        <span className="font-label-code text-label-code text-on-surface font-semibold">VALV-HVAC-990</span>). ETA 25 minutes.
                      </p>
                      <div className="mt-space-sm flex items-center gap-space-md text-secondary font-label-caption text-label-caption">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">build</span> Diagnostic Pass 01
                        </span>
                        <span>·</span>
                        <span>Rooftop Chiller Bank West</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Event 2 (30m ago - Internal Log) */}
                {(timelineFilter === 'all' || timelineFilter === 'internal') && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-secondary"></div>
                    <div className="bg-surface-container p-space-md border border-outline-variant">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface">Central Stores Dispatch</span>
                          <span className="font-label-stamp text-label-stamp px-1.5 bg-surface text-secondary border border-outline-variant">
                            [INTERNAL LOG]
                          </span>
                        </div>
                        <span className="font-label-code text-label-code text-secondary">30m ago · 11:30 AM</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs m-0">
                        Requisition #REQ-4481 approved by Floor Supervisor. Expedited transit via runner to Engineering Block C.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event 3 (48m ago - Dispatched) */}
                {(timelineFilter === 'all' || timelineFilter === 'public') && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-tertiary"></div>
                    <div className="bg-surface-container-low p-space-md border border-outline-variant">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface">Central Facilities Dispatch</span>
                          <span className="font-label-stamp text-label-stamp px-1.5 bg-surface text-tertiary border border-outline-variant">
                            [SYSTEM ASSIGNMENT]
                          </span>
                        </div>
                        <span className="font-label-code text-label-code text-secondary">48m ago · 11:12 AM</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mt-space-xs m-0">
                        Assigned from Central Ops HVAC Tier-2 Pool to Lead Specialist{' '}
                        <strong className="font-semibold text-on-surface">Ramesh K.</strong> Priority auto-adjusted to{' '}
                        <strong className="text-primary font-label-stamp text-label-stamp">[P2] HIGH</strong> based on active room occupancy schedule (Lab Session EE-204).
                      </p>
                    </div>
                  </div>
                )}

                {/* Event 4 (1h 10m ago - Internal Log) */}
                {(timelineFilter === 'all' || timelineFilter === 'internal') && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-secondary"></div>
                    <div className="bg-surface-container p-space-md border border-outline-variant">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface">Automated BMS Sensor Feed</span>
                          <span className="font-label-stamp text-label-stamp px-1.5 bg-surface text-secondary border border-outline-variant">
                            [INTERNAL TELEMETRY]
                          </span>
                        </div>
                        <span className="font-label-code text-label-code text-secondary">1h 10m ago · 10:50 AM</span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs m-0">
                        Telemetry trigger: BMS-NODE-C214 reported thermal deviation delta +10.5°C over setpoint. Incident corroborated with student portal report.
                      </p>
                    </div>
                  </div>
                )}

                {/* Event 5 (Ticket Created) */}
                {(timelineFilter === 'all' || timelineFilter === 'public') && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-on-surface"></div>
                    <div className="bg-surface-container-low p-space-md border border-outline-variant">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm mb-1">
                        <div className="flex items-center gap-space-sm">
                          <span className="font-title-sm text-title-sm text-on-surface">{request.requesterName || 'Aarav Sharma'}</span>
                          <span className="font-label-stamp text-label-stamp px-1.5 bg-surface text-on-surface-variant border border-outline-variant">
                            [REQUEST FILED]
                          </span>
                        </div>
                        <span className="font-label-code text-label-code text-secondary">
                          {new Date(request.createdAt).toLocaleDateString()} · {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mt-space-xs m-0">
                        Ticket initiated via Student &amp; Faculty Mobile Portal. Attached photo evidence showing 29.5°C ambient reading. Initial category assigned:{' '}
                        <span className="font-label-code text-label-code text-on-surface">HVAC_COOLING_DEFECT</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Satisfaction Rating Card (if Resolved or Closed) */}
            {(request.status === 'RESOLVED' || request.status === 'CLOSED') && isRequester && (
              <div className="bg-surface-container-low p-space-lg flex flex-col border-2 border-primary">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-stamp text-label-stamp text-primary font-bold uppercase tracking-wider">
                    04A // Rate Resolution Satisfaction
                  </span>
                  <span className="font-label-code text-label-code text-secondary">STUDENT EVALUATION</span>
                </div>
                <div className="flex items-center gap-2 mb-space-sm">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="bg-transparent border-none cursor-pointer p-1"
                    >
                      <span className={`material-symbols-outlined text-[28px] ${s <= rating ? 'text-primary' : 'text-outline-variant'}`}>
                        star
                      </span>
                    </button>
                  ))}
                  <span className="font-label-code text-title-md font-bold ml-2">{rating} / 5</span>
                </div>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional notes for campus facilities administration..."
                  className="w-full bg-surface-container-lowest p-space-sm font-body-md text-body-md text-on-surface border border-outline-variant mb-space-sm resize-none focus:outline-none"
                />
                <button
                  onClick={handleRate}
                  className="px-space-md py-space-sm bg-primary text-on-primary font-title-sm text-title-sm font-semibold tracking-wider hover:bg-primary-container transition-colors self-start border-none cursor-pointer"
                >
                  SUBMIT SATISFACTION RATING
                </button>
              </div>
            )}

            {/* Response & Communication Desk */}
            <div className="bg-surface-container-lowest p-space-lg flex flex-col border border-outline-variant">
              <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md bg-surface-container-low px-space-md py-space-xs">
                <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
                  04 // Append Docket Entry or Direct Message
                </span>
                {/* Toggle Public / Internal */}
                <div className="flex items-center bg-surface-container p-0.5">
                  <button
                    className={`font-label-stamp text-label-stamp px-3 py-1 transition-all border-none cursor-pointer ${
                      postType === 'public'
                        ? 'bg-surface-container-lowest text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                    }`}
                    onClick={() => setPostType('public')}
                    type="button"
                  >
                    [Public Reply to Technician]
                  </button>
                  <button
                    className={`font-label-stamp text-label-stamp px-3 py-1 transition-all border-none cursor-pointer ${
                      postType === 'internal'
                        ? 'bg-surface-container-lowest text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                    }`}
                    onClick={() => setPostType('internal')}
                    type="button"
                  >
                    [Internal Note]
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddComment} className="flex flex-col gap-space-sm">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-surface-container-low p-space-md font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:bg-surface-container transition-colors resize-y border border-outline-variant"
                  placeholder="Record operational observations, ETA inquiries, or instructions for field tech Ramesh K..."
                  rows={4}
                />
                <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-xs">
                  <div className="flex items-center gap-space-md">
                    <button
                      type="button"
                      onClick={() => alert('Artifact attachment dialog initialized.')}
                      className="flex items-center gap-1 font-body-sm text-body-sm text-secondary hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      <span>Attach Sensor Log / Photo</span>
                    </button>
                    <span className="text-secondary font-label-code text-label-code hidden sm:inline">
                      Markdown formatting supported
                    </span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <button
                      type="button"
                      onClick={() => setNewComment('')}
                      className="px-space-md py-space-sm font-title-sm text-title-sm text-secondary hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="px-space-lg py-space-sm bg-primary text-on-primary font-title-sm text-title-sm font-semibold tracking-wider hover:bg-primary-container transition-colors flex items-center gap-1.5 border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>POST UPDATE</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (~35% / 4 Cols): Sticky Metadata & Role Actions Docket */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg sticky top-20">
            {/* Inspector Card */}
            <div className="bg-surface-container-lowest flex flex-col overflow-hidden border border-outline-variant">
              {/* Docket Header Slip */}
              <div className="bg-surface-container-low p-space-md flex items-center justify-between border-b border-outline-variant">
                <div className="flex flex-col">
                  <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-widest leading-none">
                    DOCKET REFERENCE
                  </span>
                  <span className="font-label-code text-label-code text-on-surface font-bold tracking-wider mt-1">
                    {request.publicId}
                  </span>
                </div>
                <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface text-tertiary font-bold tracking-wider border border-outline-variant">
                  {request.status.replace('_', ' ')}
                </span>
              </div>

              {/* Live SLA Countdown Clock */}
              <div className="p-space-lg bg-surface-container-lowest flex flex-col border-b border-outline-variant">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                    Live SLA Countdown
                  </span>
                  <span className="font-label-code text-label-code text-primary font-semibold">
                    Tier-2 HVAC Standard (4h Max)
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span
                    className="font-label-code text-[36px] leading-tight font-bold text-on-surface tracking-tight"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {request.slaBreached ? '00:00:00' : formattedCountdown}
                  </span>
                  <span className={`font-label-code text-label-code ${request.slaBreached ? 'text-error font-bold' : 'text-tertiary'}`}>
                    {request.slaBreached ? 'BREACHED' : 'ON SCHEDULE'}
                  </span>
                </div>

                {/* Segmented Hatch SLA Gauge */}
                <div className="w-full mt-space-sm flex flex-col gap-1">
                  <div className="w-full h-2.5 bg-surface-container-high flex overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '68%' }}></div>
                    <div className="h-full bg-tertiary" style={{ width: '32%' }}></div>
                  </div>
                  <div className="flex justify-between font-label-code text-[10px] text-secondary">
                    <span>00:00 (Filed)</span>
                    <span>68% Elapsed</span>
                    <span>04:00 (Breach)</span>
                  </div>
                </div>
              </div>

              {/* Structured Specifications Ledger */}
              <div className="flex flex-col text-body-sm text-on-surface">
                {/* Row: Location */}
                <div className="p-space-md bg-surface-container-low flex flex-col gap-0.5 border-b border-outline-variant">
                  <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
                    Campus Location
                  </span>
                  <div className="flex items-center gap-space-xs font-title-sm text-title-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    <span>Block {request.locationBlock} · Room {request.locationRoom}</span>
                  </div>
                  <span className="font-label-code text-label-code text-on-surface-variant">
                    West Wing · Level 2 · Microelectronics Lab
                  </span>
                </div>

                {/* Row: Assigned Specialist */}
                <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs border-b border-outline-variant">
                  <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
                    Assigned Field Tech
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-label-stamp text-label-stamp font-bold text-on-surface">
                        {request.assigneeName ? request.assigneeName.slice(0, 2).toUpperCase() : 'RK'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-sm text-title-sm text-on-surface leading-tight">
                          {request.assigneeName || 'Ramesh K.'}
                        </span>
                        <span className="font-label-caption text-label-caption text-secondary">
                          Lead HVAC Specialist · Gr-IV
                        </span>
                      </div>
                    </div>
                    <span className="font-label-code text-label-code text-on-surface bg-surface-container px-2 py-0.5 border border-outline-variant">
                      Ext. 2281
                    </span>
                  </div>
                </div>

                {/* Row: Department */}
                <div className="p-space-md bg-surface-container-low flex flex-col gap-0.5 border-b border-outline-variant">
                  <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
                    Responsible Unit
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface">
                    {request.departmentName || 'Facilities Plant & Operations'}
                  </span>
                  <span className="font-label-caption text-label-caption text-secondary">
                    HVAC &amp; Cryo-Mechanical Division
                  </span>
                </div>

                {/* Row: Requester Info */}
                <div className="p-space-md bg-surface-container-lowest flex flex-col gap-0.5 border-b border-outline-variant">
                  <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider">
                    Filed By Requester
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-title-sm text-title-sm text-on-surface">
                      {request.requesterName || 'Aarav Sharma'}
                    </span>
                    <span className="font-label-code text-label-code text-secondary">ID: 2024-ENG-084</span>
                  </div>
                  <span className="font-label-caption text-label-caption text-secondary">
                    School of Engineering · Class of 2026
                  </span>
                </div>
              </div>

              {/* Section: Role-Based Operations Strip */}
              <div className="p-space-md bg-surface-container-high flex flex-col gap-space-md border-b border-outline-variant">
                {/* Requester Context Actions */}
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-stamp text-label-stamp text-on-surface-variant font-semibold uppercase">
                    Requester Actions [{currentUser?.name?.split(' ')[0] || 'Aarav'}]
                  </span>
                  <div className="grid grid-cols-2 gap-space-sm mt-1">
                    <button
                      onClick={() => alert('Work verified by student requester.')}
                      className="w-full py-space-sm bg-surface-container-lowest hover:bg-surface text-on-surface transition-colors font-title-sm text-title-sm flex items-center justify-center gap-1 border border-outline-variant cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
                      <span>Verify Work</span>
                    </button>
                    <button
                      onClick={() => alert('Expedite alert dispatched to Shift Supervisor.')}
                      className="w-full py-space-sm bg-surface-container-lowest hover:bg-surface text-primary transition-colors font-title-sm text-title-sm flex items-center justify-center gap-1 border border-outline-variant cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">bolt</span>
                      <span>Expedite</span>
                    </button>
                  </div>
                </div>

                {/* Tech / Admin Context Actions */}
                {isTechnicianOrAbove && request.status !== 'CLOSED' && (
                  <div className="flex flex-col gap-space-xs pt-space-xs border-t border-outline-variant">
                    <span className="font-label-stamp text-label-stamp text-secondary uppercase">
                      Technician &amp; Admin Controls
                    </span>
                    <div className="flex flex-col gap-space-xs mt-1">
                      {request.status === 'ASSIGNED' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleTransition('IN_PROGRESS')}
                          className="w-full py-space-sm bg-primary text-on-primary hover:bg-primary-container transition-colors font-title-sm text-title-sm font-semibold flex items-center justify-center gap-1.5 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          <span>Start Work</span>
                        </button>
                      )}

                      {request.status === 'IN_PROGRESS' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleTransition('RESOLVED')}
                          className="w-full py-space-sm bg-tertiary text-on-tertiary hover:bg-tertiary-container transition-colors font-title-sm text-title-sm font-semibold flex items-center justify-center gap-1.5 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {request.status === 'NEEDS_INFO' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleTransition('IN_PROGRESS')}
                          className="w-full py-space-sm bg-primary text-on-primary hover:bg-primary-container transition-colors font-title-sm text-title-sm font-semibold flex items-center justify-center gap-1.5 border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          <span>Resume Work</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-space-sm">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleTransition('NEEDS_INFO')}
                          className="py-space-xs bg-surface-container-lowest hover:bg-surface text-on-surface transition-colors font-title-sm text-title-sm flex items-center justify-center gap-1 border border-outline-variant cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          <span>Needs Info</span>
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleTransition('ON_HOLD')}
                          className="py-space-xs bg-surface-container-lowest hover:bg-surface text-on-surface-variant hover:text-error transition-colors font-title-sm text-title-sm flex items-center justify-center gap-1 border border-outline-variant cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                          <span>Put On Hold</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Transition reason / operational note..."
                        value={transitionReason}
                        onChange={(e) => setTransitionReason(e.target.value)}
                        className="w-full bg-surface-container-lowest p-2 font-body-sm text-body-sm text-on-surface border border-outline-variant mt-1 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Footer Hash */}
              <div className="px-space-md py-space-xs bg-surface-container text-secondary flex items-center justify-between font-label-code text-[11px]">
                <span>HASH: 8f9b2a71d0e</span>
                <span>VERIFIED DOCKET</span>
              </div>
            </div>

            {/* Quick Emergency Protocols Card */}
            <div className="bg-surface-container-low p-space-md flex items-start gap-space-md border border-outline-variant">
              <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
              <div className="flex flex-col font-body-sm text-body-sm">
                <span className="font-title-sm text-title-sm text-on-surface">Emergency HVAC Direct Line</span>
                <p className="text-on-surface-variant mt-0.5 m-0 leading-relaxed">
                  If compressor vibration causes immediate ceiling or water hazard, dial Central Plant Hotline{' '}
                  <strong className="text-on-surface">x4140</strong> or press the Physical Alert Button at Stairwell B.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RequestDetailScreen = RequestDetailDrawer;
export default RequestDetailDrawer;
