import { useState, useEffect } from 'react';
import { api } from './api/client';
import { ServiceRequest, User } from './types/api';
import { useNotifications } from './api/useNotifications';
import { Sidebar, ScreenId } from './components/Sidebar';
import { Topbar } from './components/Topbar';
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
    setCurrentScreen('my-requests');
  };

  const handleUpdateRequest = (updated: ServiceRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRequest(updated);
  };

  if (!currentUser) {
    return <LoginRegisterScreen onSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--paper)' }}>
      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        user={currentUser}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <Topbar
          user={currentUser}
          sseConnected={connected}
          onSearch={(query) => {
            if (query.trim()) {
              api.getRequests().then((all) => {
                const lower = query.toLowerCase();
                setRequests(
                  all.filter(
                    (r) =>
                      r.publicId.toLowerCase().includes(lower) ||
                      r.title.toLowerCase().includes(lower) ||
                      r.locationBlock.toLowerCase().includes(lower) ||
                      r.locationRoom.toLowerCase().includes(lower)
                  )
                );
              });
            } else {
              api.getRequests().then(setRequests);
            }
          }}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
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
        </main>

        {/* Global Request Detail Drawer */}
        <RequestDetailDrawer
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          currentUser={currentUser}
          onUpdateRequest={handleUpdateRequest}
        />
      </div>
    </div>
  );
}

export default App;
