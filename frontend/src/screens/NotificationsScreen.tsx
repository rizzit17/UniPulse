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
      <div className="w-full bg-surface-container-low border-b border-outline-variant py-8 px-4 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-normal">
              Notifications
            </h1>
            <p className="font-body-md text-body-md text-secondary m-0 mt-1">
              Live updates on ticket status changes, assignments, and resolution alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-3 py-1.5 border border-outline-variant flex items-center gap-2 font-medium ${
                sseConnected ? 'bg-surface text-tertiary' : 'bg-surface-container text-secondary'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  sseConnected ? 'bg-tertiary' : 'bg-secondary'
                }`}
              ></span>
              {sseConnected ? 'Connected' : 'Connecting...'}
            </span>
            <button
              onClick={onMarkAllAsRead}
              className="px-4 py-1.5 bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors border-none cursor-pointer"
            >
              Mark all read
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="py-20 text-center bg-surface-container-lowest border border-outline-variant text-secondary font-body-md">
            No notifications right now. You are all caught up!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 border border-outline-variant transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                n.read
                  ? 'bg-surface-container-lowest text-secondary opacity-80'
                  : 'bg-surface-container-low text-on-surface border-l-4 border-l-primary'
              }`}
            >
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 border border-outline-variant font-bold ${
                      n.type.includes('BREACH')
                        ? 'bg-error text-on-error'
                        : 'bg-surface text-primary'
                    }`}
                  >
                    {n.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-secondary font-label-code">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-title-sm text-title-sm text-on-surface font-semibold mt-1">
                  {n.title}
                </div>
                <p className="font-body-sm text-body-sm text-secondary m-0">
                  {n.message}
                </p>
              </div>

              {n.requestId && (
                <span className="font-label-code text-xs text-primary bg-surface px-2.5 py-1 border border-outline-variant self-start whitespace-nowrap font-medium">
                  Ticket #{n.requestId}
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
