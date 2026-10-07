export type UserRole = 
  | 'STUDENT' 
  | 'FACULTY' 
  | 'STAFF' 
  | 'TECHNICIAN' 
  | 'DEPARTMENT_HEAD' 
  | 'ADMIN';

export type RequestStatus = 
  | 'OPEN' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'NEEDS_INFO' 
  | 'ON_HOLD' 
  | 'RESOLVED' 
  | 'CLOSED' 
  | 'REOPENED' 
  | 'CANCELLED' 
  | 'REJECTED';

export type RequestPriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  campusId: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ServiceRequest {
  id: string;
  publicId: string;
  requesterId: string;
  requesterName?: string;
  departmentId: string;
  departmentName?: string;
  categoryId: string;
  categoryName?: string;
  assigneeId?: string;
  assigneeName?: string;
  title: string;
  description: string;
  locationBlock: string;
  locationRoom: string;
  locationFloor?: string;
  priority: RequestPriority;
  status: RequestStatus;
  version: number;
  respondBy?: string;
  resolveBy?: string;
  slaPausedAt?: string;
  slaPausedTotalSeconds: number;
  slaWarningIssued: boolean;
  slaBreached: boolean;
  satisfactionRating?: number;
  feedbackNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface CreateRequestDto {
  categoryId: string;
  title: string;
  description: string;
  locationBlock: string;
  locationRoom: string;
  locationFloor?: string;
  priority?: RequestPriority;
}

export interface CommentDto {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface HistoryItemDto {
  id: string;
  requestId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headUserId?: string;
  headUserName?: string;
}

export interface Category {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  defaultPriority: RequestPriority;
}

export interface SlaPolicy {
  id: string;
  priority: RequestPriority;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
}

export interface OverviewStatsResponse {
  totalCreated: number;
  totalResolved: number;
  totalBreached: number;
  totalWarnings: number;
  slaComplianceRate: number;
  avgResolveMinutes: number;
  activeHotspotsCount: number;
  dailyTrend: Array<{
    date: string;
    created: number;
    resolved: number;
    breached: number;
  }>;
}

export interface SlaMetricsResponse {
  totalEvaluated: number;
  totalBreached: number;
  totalWarnings: number;
  complianceRate: number;
  departmentBreakdown: Array<{
    departmentId: string;
    created: number;
    resolved: number;
    breached: number;
    complianceRate: number;
  }>;
}

export interface HotspotDto {
  locationBlock: string;
  locationRoom: string;
  categoryId: string;
  count30d: number;
  lastReportedAt: string;
}

export interface TechnicianWorkloadDto {
  technicianId: string;
  technicianName?: string;
  assignedCount: number;
  resolvedCount: number;
  avgResolveSeconds: number;
  avgResolveMinutes: number;
}

export interface ActivityFeedDto {
  id: string;
  requestId: string;
  publicId: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  summary: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  requestId?: string;
}
