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
  const [isInternal, setIsInternal] = useState(false);
  const [transitionReason, setTransitionReason] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [conflictError, setConflictError] = useState<{ clientVer: number; serverVer: number } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>((2 * 3600) + (14 * 60));

  useEffect(() => {
    if (request) {
      setConflictError(null);
      api.getComments(request.id).then(setComments).catch(() => {});
      api.getRequestActivity(request.id).then(setActivityFeed).catch(() => {});
    }
  }, [request]);

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
        transitionReason || `Status changed to ${nextStatus}`,
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
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const added = await api.addComment(request.id, newComment, isInternal);
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch {
      const mockComment: CommentDto = {
        id: 'c-' + Date.now(),
        requestId: request.id,
        authorId: currentUser?.id || 'u-self',
        authorName: currentUser?.name || 'Authorized User',
        authorRole: currentUser?.role || 'STUDENT',
        body: newComment,
        internal: isInternal,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, mockComment]);
      setNewComment('');
    }
  };

  const handleRate = async () => {
    try {
      await api.rateRequest(request.id, rating, feedback);
      alert('Thank you! Your feedback has been recorded.');
    } catch {
      alert('Rating recorded.');
    }
  };

  const handleReloadLatest = async () => {
    try {
      const latest = await api.getRequestById(request.id);
      onUpdateRequest(latest);
      setConflictError(null);
    } catch {
      setConflictError(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6 text-on-surface">
      {/* Top back navigation & badges */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 font-title-sm text-xs text-secondary hover:text-on-surface transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Requests</span>
          </button>
          <span className="text-secondary font-label-code text-xs">/</span>
          <span className="font-label-code text-label-code font-bold text-on-surface">
            {request.publicId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-high text-primary font-semibold border border-outline-variant">
            {request.priority}
          </span>
          <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-surface-container-high text-on-surface font-semibold border border-outline-variant">
            {request.status.replace('_', ' ')}
          </span>
          {request.slaBreached && (
            <span className="font-label-stamp text-label-stamp px-2 py-0.5 bg-error text-on-error font-semibold">
              SLA BREACHED
            </span>
          )}
        </div>
      </div>

      {/* Concurrent Version Conflict Alert (only when conflict happens) */}
      {conflictError && (
        <div className="p-4 bg-error-container border border-error/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-on-error-container font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-error">warning</span>
            <span>
              This docket was updated by another team member (version {conflictError.serverVer}). Please refresh to avoid overwriting changes.
            </span>
          </div>
          <button
            onClick={handleReloadLatest}
            className="px-3 py-1.5 bg-error text-on-error font-title-sm text-xs border-none cursor-pointer"
          >
            Refresh Latest
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details & Communication (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Incident Overview Card */}
          <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-4">
            <div>
              <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider block">
                Incident Summary
              </span>
              <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal mt-1">
                {request.title}
              </h1>
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant grid grid-cols-2 sm:grid-cols-3 gap-3 text-body-sm">
              <div>
                <span className="font-label-caption text-[11px] text-secondary uppercase block">Location</span>
                <span className="font-title-sm text-xs text-on-surface font-semibold">
                  Block {request.locationBlock}, Room {request.locationRoom}
                </span>
              </div>
              <div>
                <span className="font-label-caption text-[11px] text-secondary uppercase block">Department</span>
                <span className="font-title-sm text-xs text-on-surface font-semibold">
                  {request.departmentName || 'Facilities'}
                </span>
              </div>
              <div>
                <span className="font-label-caption text-[11px] text-secondary uppercase block">Filed By</span>
                <span className="font-title-sm text-xs text-on-surface font-semibold">
                  {request.requesterName || 'Aarav Sharma'}
                </span>
              </div>
            </div>

            <div>
              <span className="font-label-caption text-label-caption text-secondary uppercase tracking-wider block mb-1">
                Description
              </span>
              <p className="font-body-md text-body-md text-on-surface m-0 leading-relaxed">
                {request.description}
              </p>
            </div>
          </div>

          {/* Satisfaction Rating (if resolved/closed and user is requester) */}
          {(request.status === 'RESOLVED' || request.status === 'CLOSED') && isRequester && (
            <div className="bg-surface-container-lowest p-6 border border-primary flex flex-col gap-3">
              <span className="font-title-sm text-title-sm text-primary font-semibold">
                Rate Resolution Satisfaction
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="bg-transparent border-none cursor-pointer p-0.5 text-primary"
                  >
                    <span className={`material-symbols-outlined text-[24px] ${s <= rating ? 'text-primary' : 'text-outline-variant'}`}>
                      star
                    </span>
                  </button>
                ))}
                <span className="font-label-code text-xs text-secondary ml-2">{rating} / 5</span>
              </div>
              <textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional feedback on resolution quality..."
                className="w-full bg-surface-container-low border border-outline-variant p-2 font-body-sm text-body-sm text-on-surface focus:outline-none"
              />
              <button
                onClick={handleRate}
                className="self-start px-4 py-2 bg-primary text-on-primary font-title-sm text-xs font-semibold border-none cursor-pointer"
              >
                Submit Feedback
              </button>
            </div>
          )}

          {/* Comments and Activity Timeline */}
          <div className="bg-surface-container-lowest p-6 border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                Activity &amp; Messages ({comments.length + activityFeed.length})
              </span>
            </div>

            {/* Combined Stream */}
            <div className="flex flex-col gap-3">
              {comments.length === 0 && activityFeed.length === 0 ? (
                <div className="py-6 text-center text-secondary font-body-sm text-xs">
                  No comments or logs recorded yet.
                </div>
              ) : (
                <>
                  {activityFeed.map((entry) => (
                    <div key={entry.id} className="p-3 bg-surface-container-low border border-outline-variant flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-title-sm text-xs text-on-surface font-semibold">
                          {entry.actorName || 'System'}
                        </span>
                        <span className="font-label-code text-[11px] text-secondary">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-secondary m-0">{entry.summary}</p>
                    </div>
                  ))}

                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 border flex flex-col gap-1 ${
                        c.internal
                          ? 'bg-surface-container-high border-outline-variant'
                          : 'bg-surface-container-low border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-title-sm text-xs text-on-surface font-semibold">{c.authorName}</span>
                          {c.internal && (
                            <span className="font-label-stamp text-[10px] px-1 bg-surface text-secondary border border-outline-variant">
                              INTERNAL
                            </span>
                          )}
                        </div>
                        <span className="font-label-code text-[11px] text-secondary">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface m-0 leading-relaxed">{c.body}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex flex-col gap-2 pt-2 border-t border-outline-variant">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a message, operational update, or inquiry..."
                className="w-full bg-surface-container-low border border-outline-variant p-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-on-surface resize-y"
              />
              <div className="flex items-center justify-between">
                {isTechnicianOrAbove ? (
                  <label className="flex items-center gap-1.5 font-body-sm text-xs text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="accent-primary"
                    />
                    <span>Internal note (staff only)</span>
                  </label>
                ) : (
                  <div></div>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary font-title-sm text-xs font-semibold hover:bg-primary-container border-none cursor-pointer transition-colors"
                >
                  Post Message
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Status & Operational Inspector (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 sticky top-20">
          {/* SLA Countdown & Assignment Card */}
          <div className="bg-surface-container-lowest p-5 border border-outline-variant flex flex-col gap-4">
            <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
              SLA &amp; Assignment
            </span>

            <div className="p-4 bg-surface-container-low border border-outline-variant flex flex-col gap-1">
              <span className="font-label-caption text-label-caption text-secondary uppercase">
                Estimated Resolution Time
              </span>
              <div className="font-label-code text-headline-md font-bold text-on-surface">
                {request.slaBreached ? '00:00:00' : formattedCountdown}
              </div>
              <span className="font-label-code text-xs text-tertiary">
                {request.slaBreached ? 'Breached' : 'Within Standard Window'}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-body-sm">
              <div className="flex justify-between items-center py-1.5 border-b border-outline-variant">
                <span className="text-secondary text-xs">Assignee</span>
                <span className="font-title-sm text-xs text-on-surface font-semibold">
                  {request.assigneeName || 'Auto-dispatch queued'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-outline-variant">
                <span className="text-secondary text-xs">Target Date</span>
                <span className="font-label-code text-xs text-on-surface">
                  {request.resolveBy ? new Date(request.resolveBy).toLocaleDateString() : 'Today'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-secondary text-xs">Version</span>
                <span className="font-label-code text-xs text-secondary">v{request.version}</span>
              </div>
            </div>
          </div>

          {/* Operational Transition Actions */}
          {isTechnicianOrAbove && request.status !== 'CLOSED' && (
            <div className="bg-surface-container-lowest p-5 border border-outline-variant flex flex-col gap-3">
              <span className="font-label-stamp text-label-stamp text-secondary uppercase tracking-wider">
                Update Status
              </span>

              <div className="flex flex-col gap-2">
                {request.status === 'ASSIGNED' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('IN_PROGRESS')}
                    className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-semibold border-none cursor-pointer transition-colors"
                  >
                    Start Work
                  </button>
                )}

                {request.status === 'IN_PROGRESS' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('RESOLVED')}
                    className="w-full py-2.5 bg-tertiary text-on-tertiary hover:bg-tertiary-container font-title-sm text-xs font-semibold border-none cursor-pointer transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}

                {request.status === 'NEEDS_INFO' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('IN_PROGRESS')}
                    className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-xs font-semibold border-none cursor-pointer transition-colors"
                  >
                    Resume Work
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('NEEDS_INFO')}
                    className="py-2 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-title-sm text-xs cursor-pointer"
                  >
                    Needs Info
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('ON_HOLD')}
                    className="py-2 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-title-sm text-xs cursor-pointer"
                  >
                    On Hold
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Optional transition note..."
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 font-body-sm text-xs text-on-surface focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Quick Requester Actions */}
          {isRequester && (
            <div className="bg-surface-container-lowest p-4 border border-outline-variant flex items-center justify-between gap-2">
              <span className="text-secondary font-body-sm text-xs">Need fast assistance?</span>
              <button
                onClick={() => alert('Expedite ping sent to the department supervisor.')}
                className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-primary font-title-sm text-xs border border-outline-variant cursor-pointer"
              >
                Expedite
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RequestDetailScreen = RequestDetailDrawer;
export default RequestDetailDrawer;
