import React from 'react';
import { User } from '../types/api';

export type ScreenId =
  | 'my-requests'
  | 'new-request'
  | 'dept-queue'
  | 'dashboard'
  | 'admin-console'
  | 'notifications';

interface NavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  user: User | null;
  onLogout: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  user,
  onLogout,
  unreadCount = 0,
}) => {
  const isTechOrHead =
    user?.role === 'TECHNICIAN' ||
    user?.role === 'DEPARTMENT_HEAD' ||
    user?.role === 'ADMIN';
  const isHeadOrAdmin =
    user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const formatRole = (role?: string) => {
    switch (role) {
      case 'TECHNICIAN':
        return 'Technician';
      case 'DEPARTMENT_HEAD':
        return 'Dept Head';
      case 'ADMIN':
        return 'Admin';
      case 'STUDENT':
        return 'Student';
      default:
        return role ? role.charAt(0) + role.slice(1).toLowerCase() : 'User';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'TECHNICIAN':
        return 'bg-amber-500/10 text-amber-800 border-amber-500/25';
      case 'DEPARTMENT_HEAD':
        return 'bg-sky-500/10 text-sky-800 border-sky-500/25';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-800 border-purple-500/25';
      case 'STUDENT':
      default:
        return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/60">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('my-requests')}
            className="flex items-center gap-2.5 bg-transparent border-none text-left cursor-pointer p-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
              <span className="material-symbols-outlined text-[18px]">domain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-lg font-semibold tracking-tight text-on-surface">
                UniPulse
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-secondary bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant/40">
                Operations
              </span>
            </div>
          </button>

          {/* Navigation Links (Pill capsule) */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-container-low/70 p-1 rounded-lg border border-outline-variant/40">
            <button
              onClick={() => onNavigate('my-requests')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border-none ${
                currentScreen === 'my-requests'
                  ? 'bg-surface text-on-surface shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface hover:bg-surface/50 bg-transparent'
              }`}
            >
              My Requests
            </button>

            <button
              onClick={() => onNavigate('new-request')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border-none ${
                currentScreen === 'new-request'
                  ? 'bg-surface text-on-surface shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface hover:bg-surface/50 bg-transparent'
              }`}
            >
              New Request
            </button>

            {isTechOrHead && (
              <button
                onClick={() => onNavigate('dept-queue')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border-none ${
                  currentScreen === 'dept-queue'
                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface hover:bg-surface/50 bg-transparent'
                }`}
              >
                Department Queue
              </button>
            )}

            {isHeadOrAdmin && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border-none ${
                  currentScreen === 'dashboard'
                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface hover:bg-surface/50 bg-transparent'
                }`}
              >
                Analytics
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-console')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border-none ${
                  currentScreen === 'admin-console'
                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                    : 'text-secondary hover:text-on-surface hover:bg-surface/50 bg-transparent'
                }`}
              >
                Admin Console
              </button>
            )}

            <button
              onClick={() => onNavigate('notifications')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                currentScreen === 'notifications'
                  ? 'bg-surface text-on-surface shadow-xs font-bold'
                  : 'text-secondary hover:text-on-surface hover:bg-surface/50 bg-transparent'
              }`}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-on-primary">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: User Identity Profile & Switch/Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-semibold text-on-surface">
                {user?.name || 'Campus User'}
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                  user?.role
                )}`}
              >
                {formatRole(user?.role)}
              </span>
            </div>
            <span className="text-[11px] text-secondary mt-0.5">
              {user?.email || 'unipulse.edu'}
            </span>
          </div>

          {/* User Initials Avatar */}
          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface border border-outline-variant font-semibold text-xs flex items-center justify-center">
            {getInitials(user?.name)}
          </div>

          {/* Switch / Sign Out Button */}
          <button
            onClick={onLogout}
            title="Sign out or switch user"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-secondary hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors cursor-pointer border border-outline-variant/60 bg-transparent ml-1"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span className="hidden lg:inline text-[11px] font-medium">Switch</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
