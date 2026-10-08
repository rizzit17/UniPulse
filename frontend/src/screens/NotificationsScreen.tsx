import React from 'react';
import { NotificationItem } from '../types/api';

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
    <div className="w-full bg-surface text-on-surface">
      {/* Masthead */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-space-md px-4 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm">
          <div>
            <div className="flex items-center gap-space-xs font-label-stamp text-label-stamp text-secondary uppercase tracking-widest mb-1">
              <span>TELEMETRY FEED</span>
              <span>·</span>
              <span className="text-primary font-semibold">SEC-06 NOTIFICATIONS</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 leading-tight">
              Operational Notification Log
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant m-0 mt-1">
              Real-time push delivery stream via Server-Sent Events (SSE).
            </p>
          </div>
          <div className="flex items-center gap-space-md">
            <span
              className={`font-label-code text-label-code px-3 py-1.5 border border-outline-variant flex items-center gap-1.5 ${
                sseConnected ? 'bg-surface text-tertiary font-bold' : 'bg-surface-container text-secondary'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  sseConnected ? 'bg-tertiary' : 'bg-secondary'
                }`}
              ></span>
              {sseConnected ? 'SSE DISPATCH STREAM ACTIVE' : 'RECONNECTING STREAM...'}
            </span>
            <button
              onClick={onMarkAllAsRead}
              className="px-space-md py-1.5 bg-primary text-on-primary hover:bg-primary-container font-title-sm text-title-sm font-semibold transition-colors border-none cursor-pointer"
            >
              MARK ALL READ
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 py-space-xl flex flex-col gap-space-md max-w-4xl">
        {notifications.length === 0 ? (
          <div className="p-space-xl text-center bg-surface-container-lowest border border-outline-variant font-label-code text-label-code text-secondary">
            No notifications recorded in active stream.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-space-md border border-outline-variant transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-space-md ${
                n.read
                  ? 'bg-surface-container-lowest text-on-surface-variant'
                  : 'bg-surface-container-low text-on-surface border-l-4 border-l-primary'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-space-sm">
                  <span
                    className={`font-label-stamp text-label-stamp px-1.5 py-0.5 border border-outline-variant ${
                      n.type.includes('BREACH')
                        ? 'bg-error text-on-error font-bold'
                        : 'bg-surface text-primary'
                    }`}
                  >
                    [{n.type}]
                  </span>
                  <span className="font-label-code text-label-code text-secondary">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-title-sm text-title-sm text-on-surface mt-1">{n.title}</div>
                <p className="font-body-md text-body-md text-on-surface-variant m-0">{n.message}</p>
              </div>

              {n.requestId && (
                <span className="font-label-code text-label-code text-primary bg-surface px-2 py-0.5 border border-outline-variant self-start">
                  DOCKET: {n.requestId}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
