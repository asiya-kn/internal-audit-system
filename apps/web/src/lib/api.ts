import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  UserDto,
  HealthResponse,
  DashboardMetricsResponse,
  AuditUniverseListResponse,
  AuditUniverseDetailDto,
  CreateAuditUniverseRequest,
  UpdateAuditUniverseRequest,
  AuditUniverseFilters,
  AuditEntityStatus,
  RiskListResponse,
  RiskDetailDto,
  RiskDashboardDto,
  RiskActionDto,
  RiskFilters,
  CreateRiskRequest,
  UpdateRiskRequest,
  CreateRiskActionRequest,
  UpdateRiskActionRequest,
} from '@iams/shared';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const body: ApiResponse<T> = await res.json();

  if (!body.success || !body.data) {
    throw new ApiError(
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'An unexpected error occurred',
      res.status,
    );
  }

  return body.data;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function buildQuery(filters: AuditUniverseFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.status) params.set('status', filters.status);
  if (filters.parentId) params.set('parentId', filters.parentId);
  if (filters.ownerId) params.set('ownerId', filters.ownerId);
  if (filters.department) params.set('department', filters.department);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters.includeArchived) params.set('includeArchived', 'true');
  return params.toString();
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  login: (data: LoginRequest) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => request<UserDto>('/auth/me'),
  getDashboardMetrics: (path: string) => request<DashboardMetricsResponse>(path),

  listAuditUniverse: (filters: AuditUniverseFilters = {}) => {
    const qs = buildQuery(filters);
    return request<AuditUniverseListResponse>(`/audit-universe${qs ? `?${qs}` : ''}`);
  },
  getAuditUniverse: (id: string) => request<AuditUniverseDetailDto>(`/audit-universe/${id}`),
  createAuditUniverse: (data: CreateAuditUniverseRequest) =>
    request<AuditUniverseDetailDto>('/audit-universe', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAuditUniverse: (id: string, data: UpdateAuditUniverseRequest) =>
    request<AuditUniverseDetailDto>(`/audit-universe/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  setAuditUniverseStatus: (id: string, status: AuditEntityStatus) =>
    request<AuditUniverseDetailDto>(`/audit-universe/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteAuditUniverse: (id: string) =>
    request<{ message: string }>(`/audit-universe/${id}`, { method: 'DELETE' }),

  // ---- Risk Assessment ----

  listRisks: (filters: RiskFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.auditEntityId) params.set('auditEntityId', filters.auditEntityId);
    if (filters.status) params.set('status', filters.status);
    if (filters.inherentLevel) params.set('inherentLevel', filters.inherentLevel);
    if (filters.residualLevel) params.set('residualLevel', filters.residualLevel);
    if (filters.ownerId) params.set('ownerId', filters.ownerId);
    if (filters.riskCategory) params.set('riskCategory', filters.riskCategory);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    const qs = params.toString();
    return request<RiskListResponse>(`/risks${qs ? `?${qs}` : ''}`);
  },
  getRisk: (id: string) => request<RiskDetailDto>(`/risks/${id}`),
  getRiskDashboard: () => request<RiskDashboardDto>('/risks/dashboard'),
  createRisk: (data: CreateRiskRequest) =>
    request<RiskDetailDto>('/risks', { method: 'POST', body: JSON.stringify(data) }),
  updateRisk: (id: string, data: UpdateRiskRequest) =>
    request<RiskDetailDto>(`/risks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRisk: (id: string) =>
    request<{ message: string }>(`/risks/${id}`, { method: 'DELETE' }),
  createRiskAction: (riskId: string, data: CreateRiskActionRequest) =>
    request<RiskActionDto>(`/risks/${riskId}/actions`, { method: 'POST', body: JSON.stringify(data) }),
  updateRiskAction: (riskId: string, actionId: string, data: UpdateRiskActionRequest) =>
    request<RiskActionDto>(`/risks/${riskId}/actions/${actionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRiskAction: (riskId: string, actionId: string) =>
    request<{ message: string }>(`/risks/${riskId}/actions/${actionId}`, { method: 'DELETE' }),
};
