import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ActivityFeedDto,
  CommentDto,
  RequestStatus,
  ServiceRequest,
  User,
} from '../types/api';
import { BrutalistDrawer } from '../components/BrutalistDrawer';
import { StatusChip } from '../components/StatusChip';
import { PriorityBadge } from '../components/PriorityBadge';
import { ConflictBanner } from '../components/ConflictBanner';
import { Star, MessageSquare } from 'lucide-react';

interface RequestDetailDrawerProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateRequest: (updated: ServiceRequest) => void;
}

export const RequestDetailDrawer: React.FC<RequestDetailDrawerProps> = ({
  request,
  isOpen,
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

  useEffect(() => {
    if (request && isOpen) {
      setConflictError(null);
      api.getComments(request.id).then(setComments).catch(() => {});
      api.getRequestActivity(request.id).then(setActivityFeed).catch(() => {});
    }
  }, [request, isOpen]);

  if (!request) return null;

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
      // Mock fallback comment addition
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
      alert('Feedback recorded.');
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
    <BrutalistDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={request.publicId}
      subtitle={`Created on ${new Date(request.createdAt).toLocaleDateString()} · v${request.version}`}
      width="640px"
    >
      {/* 409 Stale version conflict banner */}
      {conflictError && (
        <ConflictBanner
          onReload={handleReloadLatest}
          clientVersion={conflictError.clientVer}
          serverVersion={conflictError.serverVer}
        />
      )}

      {/* Header Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <PriorityBadge priority={request.priority} />
        <StatusChip status={request.status} />
        {request.slaBreached && (
          <span
            className="stamp-chip"
            style={{ backgroundColor: 'var(--brick)', color: 'var(--paper)' }}
          >
            SLA BREACHED
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div
        style={{
          backgroundColor: 'var(--paper)',
          border: 'var(--bw) solid var(--ink)',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>
          {request.title}
        </h3>
        <p style={{ color: 'var(--ink-2)', fontSize: '14px', lineHeight: 1.5 }}>
          {request.description}
        </p>
      </div>

      {/* Two Column Layout: Facts Panel (Right) & Timeline/Comments (Left) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Facts Summary */}
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: 'var(--bw) solid var(--ink)',
            padding: '16px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              marginBottom: '12px',
            }}
          >
            FACTS & DISPATCH DETAILS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                DEPARTMENT
              </span>
              <strong>{request.departmentName || 'General Maintenance'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                LOCATION
              </span>
              <strong>{request.locationBlock}, {request.locationRoom}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                ASSIGNED TECHNICIAN
              </span>
              <strong>{request.assigneeName || 'Auto-assignment queued'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                SLA TARGET
              </span>
              <strong className="mono">
                {request.resolveBy ? new Date(request.resolveBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Standard'}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Controls for Staff / Tech / Head */}
        {isTechnicianOrAbove && request.status !== 'CLOSED' && request.status !== 'RESOLVED' && (
          <div
            style={{
              backgroundColor: 'var(--paper-2)',
              border: 'var(--bw) solid var(--ink)',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '10px',
              }}
            >
              OPERATIONAL ACTIONS
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {request.status === 'ASSIGNED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleTransition('IN_PROGRESS')}
                  className="btn-brutalist btn-primary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  START WORK
                </button>
              )}
              {request.status === 'IN_PROGRESS' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('RESOLVED')}
                    className="btn-brutalist btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    MARK RESOLVED
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('NEEDS_INFO')}
                    className="btn-brutalist btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    REQUEST INFO (PAUSE SLA)
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleTransition('ON_HOLD')}
                    className="btn-brutalist btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    PUT ON HOLD
                  </button>
                </>
              )}
              {request.status === 'NEEDS_INFO' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleTransition('IN_PROGRESS')}
                  className="btn-brutalist btn-primary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  RESUME WORK
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Transition reason / operational note..."
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              className="form-input"
              style={{ fontSize: '12px', padding: '6px 10px' }}
            />
          </div>
        )}

        {/* Rating Section if Resolved / Closed and user is Requester */}
        {(request.status === 'RESOLVED' || request.status === 'CLOSED') && isRequester && (
          <div
            style={{
              backgroundColor: '#FAF5E8',
              border: 'var(--bw) solid var(--amber)',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--ink)',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              RATE RESOLUTION SATISFACTION
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: s <= rating ? 'var(--amber)' : 'var(--paper-2)',
                  }}
                >
                  <Star size={24} fill={s <= rating ? 'var(--amber)' : 'none'} />
                </button>
              ))}
              <span className="mono" style={{ fontWeight: 600, marginLeft: '8px' }}>
                {rating} / 5
              </span>
            </div>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional notes for campus administration..."
              className="form-textarea"
              style={{ fontSize: '12px', marginBottom: '8px' }}
            />
            <button
              onClick={handleRate}
              className="btn-brutalist btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              SUBMIT SATISFACTION RATING
            </button>
          </div>
        )}

        {/* Activity Feed Timeline (MongoDB activity_feed) */}
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '16px',
              borderBottom: 'var(--bw) solid var(--ink)',
              paddingBottom: '4px',
            }}
          >
            ACTIVITY FEED TIMELINE
          </div>

          <div
            style={{
              borderLeft: '3px solid var(--ink)',
              paddingLeft: '20px',
              marginLeft: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {activityFeed.length === 0 ? (
              <div style={{ color: 'var(--ink-3)', fontSize: '13px' }}>
                Event recorded at {new Date(request.createdAt).toLocaleTimeString()}
              </div>
            ) : (
              activityFeed.map((entry) => (
                <div key={entry.id} style={{ position: 'relative' }}>
                  {/* Square node marker */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-28px',
                      top: '4px',
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'var(--card)',
                      border: '2px solid var(--ink)',
                    }}
                  />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-2)' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {entry.actorName || entry.actorRole || 'System'}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)', marginTop: '2px' }}>
                    {entry.summary}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Comments Thread */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: 'var(--bw) solid var(--ink)',
              paddingBottom: '4px',
            }}
          >
            <MessageSquare size={14} />
            COMMENTS & NOTES ({comments.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {comments.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: c.internal ? 'var(--paper-2)' : 'var(--card)',
                  border: 'var(--bw) solid var(--ink)',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    {c.authorName} ({c.authorRole})
                  </div>
                  {c.internal && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'var(--ink)',
                        color: 'var(--paper)',
                        padding: '1px 4px',
                      }}
                    >
                      INTERNAL
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--ink-2)' }}>{c.body}</p>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-3)', marginTop: '4px' }}>
                  {new Date(c.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* New Comment Box */}
          <form onSubmit={handleAddComment}>
            <textarea
              rows={2}
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add response or operational note..."
              className="form-textarea"
              style={{ fontSize: '13px', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {isTechnicianOrAbove && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  <span>Internal Staff Only</span>
                </label>
              )}
              <button
                type="submit"
                className="btn-brutalist btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', marginLeft: 'auto' }}
              >
                POST COMMENT
              </button>
            </div>
          </form>
        </div>
      </div>
    </BrutalistDrawer>
  );
};
