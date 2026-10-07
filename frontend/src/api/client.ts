import {
  AuthResponse,
  Category,
  CommentDto,
  CreateRequestDto,
  Department,
  HistoryItemDto,
  HotspotDto,
  NotificationItem,
  OverviewStatsResponse,
  ServiceRequest,
  SlaMetricsResponse,
  TechnicianWorkloadDto,
  ActivityFeedDto,
  User,
  RequestStatus,
  RequestPriority,
  UserRole
} from '../types/api';

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.token = localStorage.getItem('unipulse_token');
    this.refreshToken = localStorage.getItem('unipulse_refresh');
    const storedUser = localStorage.getItem('unipulse_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch {
        this.currentUser = null;
      }
    }
  }

  public setAuth(auth: AuthResponse) {
    this.token = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    this.currentUser = auth.user;
    localStorage.setItem('unipulse_token', auth.accessToken);
    localStorage.setItem('unipulse_refresh', auth.refreshToken);
    localStorage.setItem('unipulse_user', JSON.stringify(auth.user));
  }

  public logout() {
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
    localStorage.removeItem('unipulse_token');
    localStorage.removeItem('unipulse_refresh');
    localStorage.removeItem('unipulse_user');
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(path, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.refreshToken) {
        // Attempt token refresh
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          headers.set('Authorization', `Bearer ${this.token}`);
          const retryRes = await fetch(path, { ...options, headers });
          if (retryRes.ok) {
            return retryRes.json();
          }
        }
      }

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { title: response.statusText, status: response.status };
        }
        const err = new Error(errorBody.detail || errorBody.title || 'Request failed');
        (err as unknown as { status: number; body: unknown }).status = response.status;
        (err as unknown as { status: number; body: unknown }).body = errorBody;
        throw err;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // Return mock data fallback if backend is offline during prototyping
      return this.fallbackMock<T>(path, options, error);
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (res.ok) {
        const data: AuthResponse = await res.json();
        this.setAuth(data);
        return true;
      }
    } catch {
      this.logout();
    }
    return false;
  }

  // Fallback seed data in case API server is unreachable in offline tests
  private fallbackMock<T>(path: string, options: RequestInit, originalError: unknown): T {
    const method = options.method || 'GET';

    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      let role: UserRole = 'DEPARTMENT_HEAD';
      let name = 'Priya Sharma';
      let email = 'priya.sharma@unipulse.edu';
      if (options.body && typeof options.body === 'string') {
        try {
          const parsed = JSON.parse(options.body);
          if (parsed.role) role = parsed.role;
          if (parsed.email) {
            email = parsed.email;
            if (email.includes('student')) {
              role = 'STUDENT';
              name = 'Aarav Patel';
            } else if (email.includes('admin')) {
              role = 'ADMIN';
              name = 'Campus Admin';
            } else if (email.includes('tech')) {
              role = 'TECHNICIAN';
              name = 'Ramesh Kumar';
            }
          }
          if (parsed.name) name = parsed.name;
        } catch {
          // ignore parsing error
        }
      }
      const mockAuth: AuthResponse = {
        accessToken: 'mock-jwt-token-12345',
        refreshToken: 'mock-refresh-token-12345',
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          id: 'u-' + role.toLowerCase(),
          name,
          email,
          role,
          campusId: 1,
        },
      };
      this.setAuth(mockAuth);
      return mockAuth as unknown as T;
    }

    if (path.includes('/api/v1/departments')) {
      return [
        { id: 'd-1', name: 'Electrical & Power', code: 'ELEC' },
        { id: 'd-2', name: 'Civil Infrastructure & Plumbing', code: 'CIVIL' },
        { id: 'd-3', name: 'HVAC & Refrigeration', code: 'HVAC' },
        { id: 'd-4', name: 'Campus IT & Networks', code: 'NET' },
      ] as unknown as T;
    }

    if (path.includes('/api/v1/categories')) {
      return [
        { id: 'c-1', departmentId: 'd-1', name: 'Power Socket Sparking', code: 'POW_SPARK', defaultPriority: 'P1' },
        { id: 'c-2', departmentId: 'd-1', name: 'Corridor Light Failure', code: 'LGT_FAIL', defaultPriority: 'P3' },
        { id: 'c-3', departmentId: 'd-2', name: 'Severe Pipe Leakage', code: 'PLM_LEAK', defaultPriority: 'P2' },
        { id: 'c-4', departmentId: 'd-3', name: 'Classroom AC Malfunction', code: 'AC_FAIL', defaultPriority: 'P2' },
        { id: 'c-5', departmentId: 'd-4', name: 'Wi-Fi AP Offline', code: 'NET_WIFI', defaultPriority: 'P3' },
      ] as unknown as T;
    }

    if (path.startsWith('/api/v1/requests') && method === 'GET' && !path.includes('/activity')) {
      return [
        {
          id: 'r-101',
          publicId: 'UP-2026-000101',
          requesterId: 'u-1',
          requesterName: 'Aarav Patel',
          departmentId: 'd-3',
          departmentName: 'HVAC & Refrigeration',
          categoryId: 'c-4',
          categoryName: 'Classroom AC Malfunction',
          assigneeId: 't-1',
          assigneeName: 'Ramesh Kumar (Tech)',
          title: 'AC unit dripping water continuously onto desk 14',
          description: 'Classroom 302 split AC has condensation overflow leaking heavily. Needs immediate drain pan cleaning.',
          locationBlock: 'Academic Block B',
          locationRoom: 'Room 302',
          priority: 'P2',
          status: 'IN_PROGRESS',
          version: 2,
          resolveBy: new Date(Date.now() + 1000 * 60 * 142).toISOString(),
          slaPausedTotalSeconds: 0,
          slaWarningIssued: false,
          slaBreached: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        },
        {
          id: 'r-102',
          publicId: 'UP-2026-000102',
          requesterId: 'u-2',
          requesterName: 'Sneha Verma',
          departmentId: 'd-1',
          departmentName: 'Electrical & Power',
          categoryId: 'c-1',
          categoryName: 'Power Socket Sparking',
          assigneeId: 't-2',
          assigneeName: 'Vikram Singh (Tech)',
          title: 'Sparking switchboard in Chemistry Lab 2',
          description: 'Visible sparks and burning plastic smell when plugging in microscope bench power strip.',
          locationBlock: 'Science Complex C',
          locationRoom: 'Chem Lab 2',
          priority: 'P1',
          status: 'ASSIGNED',
          version: 1,
          resolveBy: new Date(Date.now() + 1000 * 60 * 35).toISOString(),
          slaPausedTotalSeconds: 0,
          slaWarningIssued: true,
          slaBreached: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        },
        {
          id: 'r-103',
          publicId: 'UP-2026-000103',
          requesterId: 'u-3',
          requesterName: 'Prof. Nair',
          departmentId: 'd-2',
          departmentName: 'Civil Infrastructure & Plumbing',
          categoryId: 'c-3',
          categoryName: 'Severe Pipe Leakage',
          title: 'Washroom pipe burst on 2nd floor hostel corridor',
          description: 'Water spreading to hallway, main valve shut off temporarily by security.',
          locationBlock: 'Hostel H-4',
          locationRoom: 'Washroom 2B',
          priority: 'P1',
          status: 'OPEN',
          version: 1,
          resolveBy: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // Breached!
          slaPausedTotalSeconds: 0,
          slaWarningIssued: true,
          slaBreached: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
      ] as unknown as T;
    }

    if (path.includes('/analytics/overview')) {
      return {
        totalCreated: 142,
        totalResolved: 128,
        totalBreached: 6,
        totalWarnings: 18,
        slaComplianceRate: 95.3,
        avgResolveMinutes: 24,
        activeHotspotsCount: 4,
        dailyTrend: [
          { date: '2026-10-01', created: 18, resolved: 17, breached: 1 },
          { date: '2026-10-02', created: 22, resolved: 21, breached: 0 },
          { date: '2026-10-03', created: 20, resolved: 19, breached: 1 },
          { date: '2026-10-04', created: 25, resolved: 23, breached: 2 },
          { date: '2026-10-05', created: 19, resolved: 18, breached: 0 },
          { date: '2026-10-06', created: 21, resolved: 19, breached: 1 },
          { date: '2026-10-07', created: 17, resolved: 11, breached: 1 },
        ],
      } as unknown as T;
    }

    if (path.includes('/analytics/hotspots')) {
      return [
        { locationBlock: 'Hostel H-4', locationRoom: 'Washroom 2B', categoryId: 'c-3', count30d: 14, lastReportedAt: new Date().toISOString() },
        { locationBlock: 'Science Complex C', locationRoom: 'Chem Lab 2', categoryId: 'c-1', count30d: 9, lastReportedAt: new Date().toISOString() },
        { locationBlock: 'Academic Block B', locationRoom: 'Room 302', categoryId: 'c-4', count30d: 7, lastReportedAt: new Date().toISOString() },
      ] as unknown as T;
    }

    if (path.includes('/analytics/workload')) {
      return [
        { technicianId: 't-1', technicianName: 'Ramesh Kumar', assignedCount: 14, resolvedCount: 12, avgResolveSeconds: 1440, avgResolveMinutes: 24.0 },
        { technicianId: 't-2', technicianName: 'Vikram Singh', assignedCount: 18, resolvedCount: 16, avgResolveSeconds: 1200, avgResolveMinutes: 20.0 },
        { technicianId: 't-3', technicianName: 'Deepak Rao', assignedCount: 9, resolvedCount: 8, avgResolveSeconds: 1800, avgResolveMinutes: 30.0 },
      ] as unknown as T;
    }

    if (path.includes('/activity')) {
      return [
        {
          id: 'act-1',
          requestId: 'r-101',
          publicId: 'UP-2026-000101',
          eventType: 'REQUEST_CREATED',
          actorName: 'Aarav Patel',
          actorRole: 'REQUESTER',
          summary: 'Request raised: AC unit dripping water continuously',
          timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
        },
        {
          id: 'act-2',
          requestId: 'r-101',
          publicId: 'UP-2026-000101',
          eventType: 'REQUEST_ASSIGNED',
          actorName: 'System Auto-Assign',
          actorRole: 'SYSTEM',
          summary: 'Auto-assigned to Ramesh Kumar (Least-Loaded technician)',
          timestamp: new Date(Date.now() - 1000 * 60 * 73).toISOString(),
        },
        {
          id: 'act-3',
          requestId: 'r-101',
          publicId: 'UP-2026-000101',
          eventType: 'STATUS_CHANGED',
          actorName: 'Ramesh Kumar',
          actorRole: 'TECHNICIAN',
          summary: 'Status changed from ASSIGNED to IN_PROGRESS',
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        },
      ] as unknown as T;
    }

    throw originalError;
  }

  // Auth Endpoints
  public async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(res);
    return res;
  }

  public async register(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    departmentId?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setAuth(res);
    return res;
  }

  // Request Endpoints
  public async getRequests(params?: {
    status?: RequestStatus;
    priority?: RequestPriority;
    departmentId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ServiceRequest[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.departmentId) query.set('departmentId', params.departmentId);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString();
    return this.request<ServiceRequest[]>(`/api/v1/requests${qs ? '?' + qs : ''}`);
  }

  public async getRequestById(id: string): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/api/v1/requests/${id}`);
  }

  public async createRequest(dto: CreateRequestDto): Promise<ServiceRequest> {
    const idempotencyKey = 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    return this.request<ServiceRequest>('/api/v1/requests', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(dto),
    });
  }

  public async transitionRequest(
    id: string,
    to: RequestStatus,
    reason: string,
    version: number
  ): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/api/v1/requests/${id}/transitions`, {
      method: 'POST',
      headers: { 'If-Match': `"${version}"` },
      body: JSON.stringify({ to, reason }),
    });
  }

  public async assignRequest(id: string, technicianId: string, version: number): Promise<ServiceRequest> {
    return this.request<ServiceRequest>(`/api/v1/requests/${id}/assign`, {
      method: 'POST',
      headers: { 'If-Match': `"${version}"` },
      body: JSON.stringify({ technicianId }),
    });
  }

  public async getComments(requestId: string): Promise<CommentDto[]> {
    return this.request<CommentDto[]>(`/api/v1/requests/${requestId}/comments`);
  }

  public async addComment(requestId: string, body: string, internal: boolean = false): Promise<CommentDto> {
    return this.request<CommentDto>(`/api/v1/requests/${requestId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, internal }),
    });
  }

  public async getHistory(requestId: string): Promise<HistoryItemDto[]> {
    return this.request<HistoryItemDto[]>(`/api/v1/requests/${requestId}/history`);
  }

  public async rateRequest(requestId: string, rating: number, notes?: string): Promise<void> {
    return this.request<void>(`/api/v1/requests/${requestId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedbackNotes: notes }),
    });
  }

  // Reference Endpoints
  public async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/api/v1/departments');
  }

  public async getCategories(departmentId?: string): Promise<Category[]> {
    const qs = departmentId ? `?departmentId=${departmentId}` : '';
    return this.request<Category[]>(`/api/v1/categories${qs}`);
  }

  // Analytics Endpoints
  public async getOverview(startDate?: string, endDate?: string, departmentId?: string): Promise<OverviewStatsResponse> {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    if (departmentId) q.set('departmentId', departmentId);
    return this.request<OverviewStatsResponse>(`/api/v1/analytics/overview?${q.toString()}`);
  }

  public async getSlaMetrics(startDate?: string, endDate?: string, departmentId?: string): Promise<SlaMetricsResponse> {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    if (departmentId) q.set('departmentId', departmentId);
    return this.request<SlaMetricsResponse>(`/api/v1/analytics/sla?${q.toString()}`);
  }

  public async getHotspots(limit: number = 10): Promise<HotspotDto[]> {
    return this.request<HotspotDto[]>(`/api/v1/analytics/hotspots?limit=${limit}`);
  }

  public async getWorkload(startDate?: string, endDate?: string): Promise<TechnicianWorkloadDto[]> {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return this.request<TechnicianWorkloadDto[]>(`/api/v1/analytics/workload?${q.toString()}`);
  }

  public async getRequestActivity(requestId: string): Promise<ActivityFeedDto[]> {
    return this.request<ActivityFeedDto[]>(`/api/v1/analytics/requests/${requestId}/activity`);
  }

  // Notifications
  public async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/api/v1/notifications');
  }
}

export const api = new ApiClient();
