import { useState, useEffect } from 'react';
import { api } from './api/client';
import { ServiceRequest, User } from './types/api';
import { useNotifications } from './api/useNotifications';
import { Navbar, ScreenId } from './components/Navbar';
import { LoginRegisterScreen } from './screens/LoginRegisterScreen';
import { MyRequestsScreen } from './screens/MyRequestsScreen';
import { NewRequestScreen } from './screens/NewRequestScreen';
import { DepartmentQueueScreen } from './screens/DepartmentQueueScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { AdminConsoleScreen } from './screens/AdminConsoleScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { RequestDetailDrawer } from './screens/RequestDetailDrawer';
import './styles/tokens.css';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(api.getUser());
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('my-requests');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const { notifications, unreadCount, markAllAsRead, connected } = useNotifications();

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      api.getRequests()
        .then(setRequests)
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'DEPARTMENT_HEAD' || user.role === 'ADMIN') {
      setCurrentScreen('dashboard');
    } else if (user.role === 'TECHNICIAN') {
      setCurrentScreen('dept-queue');
    } else {
      setCurrentScreen('my-requests');
    }
  };

  const handleRequestCreated = (created: ServiceRequest) => {
    setRequests((prev) => [created, ...prev]);
    setSelectedRequest(created);
  };

  const handleUpdateRequest = (updated: ServiceRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRequest(updated);
  };

  const handleNavigate = (screen: ScreenId) => {
    setSelectedRequest(null);
    setCurrentScreen(screen);
  };

  if (!currentUser) {
    return <LoginRegisterScreen onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Architectural Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        user={currentUser}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Dynamic Workspace */}
      <main className="w-full pt-16 flex-1 flex flex-col bg-surface">
        {selectedRequest ? (
          <RequestDetailDrawer
            request={selectedRequest}
            isOpen={true}
            onClose={() => setSelectedRequest(null)}
            currentUser={currentUser}
            onUpdateRequest={handleUpdateRequest}
          />
        ) : (
          <>
            {currentScreen === 'my-requests' && (
              <MyRequestsScreen
                requests={requests}
                loading={loading}
                onSelectRequest={(req) => setSelectedRequest(req)}
                onRaiseRequest={() => setCurrentScreen('new-request')}
              />
            )}

            {currentScreen === 'new-request' && (
              <NewRequestScreen
                onSuccess={handleRequestCreated}
                onCancel={() => setCurrentScreen('my-requests')}
              />
            )}

            {currentScreen === 'dept-queue' && (
              <DepartmentQueueScreen
                requests={requests}
                onSelectRequest={(req) => setSelectedRequest(req)}
                currentUser={currentUser}
              />
            )}

            {currentScreen === 'dashboard' && <DashboardScreen />}

            {currentScreen === 'admin-console' && <AdminConsoleScreen />}

            {currentScreen === 'notifications' && (
              <NotificationsScreen
                notifications={notifications}
                onMarkAllAsRead={markAllAsRead}
                sseConnected={connected}
              />
            )}
          </>
        )}
      </main>

      {/* Civic Cartography Infrastructure Broadsheet Footer */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant py-space-lg mt-auto">
        <div className="w-full px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant">
          <div className="flex items-center gap-space-md">
            <span className="font-label-stamp text-label-stamp text-on-surface font-semibold uppercase tracking-wider">
              UNIPULSE / INFRASTRUCTURE
            </span>
            <span className="font-label-code text-label-code text-secondary">
              SYS-REF: CAMPUS-OPS-2026
            </span>
          </div>
          <div className="flex items-center gap-space-lg font-body-sm text-body-sm">
            <span className="font-label-caption text-label-caption text-secondary">
              Central Facilities Dispatch · Extension 4140
            </span>
            <span className="font-label-code text-label-code text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block"></span>
              [● SYSTEM OPERATIONAL]
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
