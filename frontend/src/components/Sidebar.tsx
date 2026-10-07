import React from 'react';
import {
  FileText,
  PlusSquare,
  ListOrdered,
  BarChart3,
  Shield,
  Bell,
  LogOut,
} from 'lucide-react';
import { User } from '../types/api';

export type ScreenId = 
  | 'my-requests' 
  | 'new-request' 
  | 'dept-queue' 
  | 'dashboard' 
  | 'admin-console' 
  | 'notifications';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  user: User | null;
  onLogout: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  user,
  onLogout,
  unreadCount = 0,
}) => {
  const isHeadOrAdmin = user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN';
  const isTechOrHead = user?.role === 'TECHNICIAN' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const navItems: Array<{ id: ScreenId; label: string; icon: React.ReactNode; show: boolean; badge?: number }> = [
    {
      id: 'my-requests',
      label: 'MY REQUESTS',
      icon: <FileText size={18} />,
      show: true,
    },
    {
      id: 'new-request',
      label: 'RAISE REQUEST',
      icon: <PlusSquare size={18} />,
      show: true,
    },
    {
      id: 'dept-queue',
      label: 'DEPT QUEUE',
      icon: <ListOrdered size={18} />,
      show: isTechOrHead,
    },
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      icon: <BarChart3 size={18} />,
      show: isHeadOrAdmin,
    },
    {
      id: 'admin-console',
      label: 'ADMIN CONSOLE',
      icon: <Shield size={18} />,
      show: isAdmin,
    },
    {
      id: 'notifications',
      label: 'NOTIFICATIONS',
      icon: <Bell size={18} />,
      show: true,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  return (
    <aside
      style={{
        width: '232px',
        minWidth: '232px',
        height: '100vh',
        backgroundColor: 'var(--ink)',
        color: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: 'var(--bw) solid var(--ink)',
      }}
    >
      <div>
        {/* Wordmark Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid var(--ink-2)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'var(--paper)',
            }}
          >
            UP
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--amber)',
              letterSpacing: '0.04em',
            }}
          >
            UniPulse
          </span>
        </div>

        {/* Navigation list */}
        <nav style={{ marginTop: '16px' }}>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const active = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    backgroundColor: active ? 'var(--ink-2)' : 'transparent',
                    color: 'var(--paper)',
                    border: 'none',
                    borderLeft: active ? '4px solid var(--amber)' : '4px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    textAlign: 'left',
                    transition: 'background-color 100ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      style={{
                        backgroundColor: 'var(--brick)',
                        color: 'var(--paper)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: 'var(--r-sm)',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div
        style={{
          padding: '20px',
          borderTop: '1px solid var(--ink-2)',
          backgroundColor: '#1E1D15',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--paper)' }}>
            {user?.name || 'Authorized User'}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--amber)',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            ROLE: {user?.role || 'REQUESTER'}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="btn-brutalist btn-secondary"
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: '12px',
          }}
        >
          <LogOut size={14} />
          LOGOUT
        </button>
      </div>
    </aside>
  );
};
