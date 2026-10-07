import { useEffect, useState, useCallback } from 'react';
import { NotificationItem } from '../types/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      userId: 'u-demo-1',
      title: 'P1 SLA Breach Escalation',
      message: 'Request UP-2026-000103 breached 15m ago. Escalated to Department Head.',
      type: 'SLA_BREACH',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      requestId: 'r-103',
    },
    {
      id: 'notif-2',
      userId: 'u-demo-1',
      title: 'Technician Assigned',
      message: 'Vikram Singh assigned to UP-2026-000102 (Power Socket Sparking).',
      type: 'ASSIGNED',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      requestId: 'r-102',
    },
  ]);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('unipulse_token');
    if (!token) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/v1/notifications/stream?token=${token}`);

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.addEventListener('NOTIFICATION', (event) => {
        try {
          const item: NotificationItem = JSON.parse(event.data);
          setNotifications((prev) => [item, ...prev]);
        } catch {
          // ignore parse errors
        }
      });

      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAllAsRead, connected };
}
