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

  const roleLabel = user?.role === 'DEPARTMENT_HEAD' ? 'DEPT HEAD' : user?.role || 'REQUESTER';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-outline-variant">
      <div className="h-16 w-full px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('my-requests')}
            className="flex items-center gap-2 pr-6 border-r border-outline-variant bg-transparent text-left cursor-pointer border-y-0 border-l-0"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
            <div className="flex flex-col">
              <span className="font-label-stamp text-label-stamp uppercase tracking-widest text-on-surface font-semibold">
                UNIPULSE
              </span>
              <span className="font-label-caption text-label-caption text-on-surface-variant text-[10px] uppercase tracking-wider leading-none">
                Campus Facilities &amp; Ops
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center h-16">
            <button
              onClick={() => onNavigate('my-requests')}
              className={`h-16 px-4 flex items-center font-title-sm text-title-sm transition-colors border-b-2 cursor-pointer ${
                currentScreen === 'my-requests'
                  ? 'bg-surface-container-highest text-on-surface font-semibold border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent'
              }`}
            >
              My Requests
            </button>

            <button
              onClick={() => onNavigate('new-request')}
              className={`h-16 px-4 flex items-center font-title-sm text-title-sm transition-colors border-b-2 cursor-pointer ${
                currentScreen === 'new-request'
                  ? 'bg-surface-container-highest text-on-surface font-semibold border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent'
              }`}
            >
              New Request
            </button>

            {isTechOrHead && (
              <button
                onClick={() => onNavigate('dept-queue')}
                className={`h-16 px-4 flex items-center font-title-sm text-title-sm transition-colors border-b-2 cursor-pointer ${
                  currentScreen === 'dept-queue'
                    ? 'bg-surface-container-highest text-on-surface font-semibold border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent'
                }`}
              >
                Department Queue
              </button>
            )}

            {isHeadOrAdmin && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`h-16 px-4 flex items-center font-title-sm text-title-sm transition-colors border-b-2 cursor-pointer ${
                  currentScreen === 'dashboard'
                    ? 'bg-surface-container-highest text-on-surface font-semibold border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent'
                }`}
              >
                Analytics
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-console')}
                className={`h-16 px-4 flex items-center font-title-sm text-title-sm transition-colors border-b-2 cursor-pointer ${
                  currentScreen === 'admin-console'
                    ? 'bg-surface-container-highest text-on-surface font-semibold border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent'
                }`}
              >
                Admin Console
              </button>
            )}

            <button
              onClick={() => onNavigate('notifications')}
              className={`h-16 px-4 flex items-center gap-1 font-title-sm text-title-sm transition-colors border-b-2 cursor-pointer ${
                currentScreen === 'notifications'
                  ? 'bg-surface-container-highest text-on-surface font-semibold border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-transparent'
              }`}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="font-label-stamp text-label-stamp bg-surface-container-high text-primary px-1.5 py-0.5 border border-outline-variant leading-none">
                  [{unreadCount}]
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: User Identity Profile & Logout */}
        <div className="flex items-center gap-4 pl-6 border-l border-outline-variant">
          <div className="hidden sm:flex flex-col text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                {user?.name || 'Campus User'}
              </span>
              <span className="font-label-stamp text-label-stamp border border-outline px-1 text-on-surface-variant leading-none">
                [{roleLabel}]
              </span>
            </div>
            <span className="font-label-caption text-label-caption text-secondary text-[11px]">
              {user?.email || 'Central Campus ID'}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Switch Account or Exit"
            className="flex items-center justify-center p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
          </button>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
