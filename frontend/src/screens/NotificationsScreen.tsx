import React from 'react';
import { NotificationItem } from '../types/api';
import { CheckCheck, Radio } from 'lucide-react';

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  sseConnected: boolean;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onMarkAllAsRead,
  sseConnected,
}) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
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
            NOTIFICATION DISPATCH LOG
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--ink-2)', fontSize: '15px' }}>
              Real-time push delivery stream via Server-Sent Events (SSE).
            </span>
            <span
              className="stamp-chip"
              style={{
                backgroundColor: sseConnected ? '#E7EFE0' : 'var(--paper-2)',
                color: sseConnected ? 'var(--moss)' : 'var(--ink-3)',
                fontSize: '11px',
              }}
            >
              <Radio size={10} />
              {sseConnected ? 'LIVE FEED ACTIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        <button
          onClick={onMarkAllAsRead}
          className="btn-brutalist btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          <CheckCheck size={16} />
          MARK ALL READ
        </button>
      </div>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: 'var(--card)',
              border: 'var(--bw) solid var(--ink)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            No notifications recorded yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                backgroundColor: n.read ? 'var(--paper-2)' : 'var(--card)',
                border: 'var(--bw) solid var(--ink)',
                borderLeft: n.read ? 'var(--bw) solid var(--ink)' : '6px solid var(--ink)',
                boxShadow: n.read ? 'none' : 'var(--sh-sm)',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    className="stamp-chip"
                    style={{
                      backgroundColor: n.type.includes('BREACH') ? 'var(--brick)' : 'var(--card)',
                      color: n.type.includes('BREACH') ? 'var(--paper)' : 'var(--ink)',
                      fontSize: '10px',
                    }}
                  >
                    {n.type}
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>{n.title}</strong>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.4 }}>
                  {n.message}
                </p>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--ink-3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
