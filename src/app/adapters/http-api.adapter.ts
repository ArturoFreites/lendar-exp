import { triggerGlobalError } from '../utils/globalErrorHandler';
import { triggerSessionInvalid } from '../utils/sessionInvalidHandler';
import type { ApiRepository } from '../repositories/api.repository';
import type {
  QrResponse,
  BackendPaginationResponse,
  PaginationResponse,
  AuthRequest,
  AuthResponse,
  NotificationResponse,
  NotificationConfigRequest,
  NotificationConfigResponse,
  EmailConfigRequest,
  EmailConfigResponse,
  EmailLayoutConfigRequest,
  EmailLayoutConfigResponse,
  UserProfileResponse,
  UserResponse,
  MigratedPersonResponse,
  UserRoleUpdaterRequest,
  UserUpdateRequest,
  UserFcmTokenRequest,
  UserSessionResponse,
  RoleResponse,
  RoleRequest,
  PermissionResponse,
  PermissionRequest,
  TaskTypeRoleRequest,
  ApplicationResponse,
  ApplicationFindResponse,
  StateResponse,
  CityResponse,
  NotaryOfficeResponse,
  NotaryOfficeRequest,
  NotaryOfficeUpdateRequest,
  ApplicationReceivedResponse,
  ActionResponse,
  TaskConfigActionsResponse,
  FormResponse,
  TaskConfigSaveRequest,
  TaskConfigListItem,
  RegionResponse,
  RegionRequest,
  RegionUpdateRequest,
  FranchiseResponse,
  FranchiseRequest,
  FranchiseUpdateRequest,
  CoverageAreaResponse,
  CoverageAreaRequest,
  NormalizeAddressesJobStartResponse,
  NormalizeAddressesJobStatusResponse,
  ApplicationConfigResponse,
  ApplicationConfigRequest,
} from '../types/dto';

export class HttpApiAdapter implements ApiRepository {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async refreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const { getFCMToken, getPlatform } = await import('../services/firebase');

        let fcmToken: string | null = null;
        try {
          fcmToken = await getFCMToken();
        } catch {
          console.warn('No se pudo obtener token FCM para refresh');
        }

        const platform = getPlatform();
        const body: Record<string, string> = {};
        if (fcmToken) body.fcmToken = fcmToken;
        if (platform) body.platform = platform;

        const requestOptions: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        };
        if (Object.keys(body).length > 0) {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}/backoffice/api/auth/refresh`, requestOptions);
        if (response.ok) return true;
        console.error('Error al refrescar token:', response.status);
        return false;
      } catch (error) {
        console.error('Error al refrescar token:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOn403 = true
  ): Promise<QrResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const isFcmRequest = endpoint.includes('/fcm-token');
    if (isFcmRequest) {
      console.log('🌐 [REQUEST] Iniciando petición FCM:', {
        url,
        method: options.method || 'GET',
        hasBody: !!options.body,
        bodyPreview: options.body ? (typeof options.body === 'string' ? options.body.substring(0, 100) + '...' : 'Object') : undefined,
      });
    }

    const defaultHeaders: HeadersInit = { 'Content-Type': 'application/json' };

    let response: Response;
    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
        credentials: 'include',
      };
      if (isFcmRequest) {
        console.log('🌐 [REQUEST] Opciones de fetch:', {
          method: fetchOptions.method,
          headers: fetchOptions.headers,
          hasBody: !!fetchOptions.body,
          credentials: fetchOptions.credentials,
        });
      }
      response = await fetch(url, fetchOptions);
      if (isFcmRequest) {
        console.log('🌐 [REQUEST] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        });
      }
    } catch (networkError) {
      const errorMessage =
        networkError instanceof Error ? networkError.message : 'Error de conexión. Verifica tu conexión a internet.';
      triggerGlobalError({ title: 'Error de conexión', message: errorMessage, code: 0 });
      throw { message: errorMessage, code: 0, isNetworkError: true };
    }

    const isAuthError =
      (response.status === 401 || response.status === 403) &&
      retryOn403 &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/login');

    if (isAuthError) {
      const errorDataPromise = response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
        code: response.status,
        errors: undefined as string[] | undefined,
      }));

      const refreshSuccess = await this.refreshToken();
      if (refreshSuccess) {
        return this.request<T>(endpoint, options, false);
      }

      const errorData = await errorDataPromise;
      const error = {
        message:
          errorData.message ||
          (response.status === 401 ? 'Sesión expirada. Por favor, inicia sesión nuevamente.' : `Error ${response.status}: ${response.statusText}`),
        code: response.status,
        errors: errorData.errors ?? null,
      };
      triggerGlobalError({ title: 'Sesión inválida', message: error.message, code: error.code, errors: error.errors ?? undefined });
      if (response.status === 401) triggerSessionInvalid();
      throw error;
    }

    if (!response.ok && response.status !== 200 && response.status !== 201) {
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
        code: response.status,
      }));
      const error = {
        message: errorData.message || `Error ${response.status}`,
        code: response.status,
        errors: errorData.errors || null,
      };
      const isFcmEndpoint = endpoint.includes('/fcm-token');
      if (!isFcmEndpoint) {
        triggerGlobalError({ title: 'Error en la petición', message: error.message, code: error.code, errors: error.errors ?? undefined });
      }
      throw error;
    }

    return response.json();
  }

  private normalizePaginationResponse<T>(backendResponse: BackendPaginationResponse<T>): PaginationResponse<T> {
    return {
      content: backendResponse.results || [],
      totalElements: backendResponse.totalItems || 0,
      totalPages: backendResponse.totalPages || 0,
      size: backendResponse.results?.length || 0,
      number: backendResponse.page || 0,
    };
  }

  async login(email: string, password: string): Promise<QrResponse<AuthResponse>> {
    const body: AuthRequest = { email, password };
    console.log('📤 Request de login:', { email, hasPassword: !!password });
    return this.request<AuthResponse>('/backoffice/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  async logout(): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  }

  async getNotifications(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotificationResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/notification${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<NotificationResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async markNotificationAsRead(id: number): Promise<QrResponse<NotificationResponse>> {
    return this.request<NotificationResponse>(`/backoffice/api/notification/${id}/read`, { method: 'PUT' });
  }

  async getNotificationConfigs(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotificationConfigResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/notificationConfig${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<NotificationConfigResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getNotificationConfigById(id: number): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/${id}`, { method: 'GET' });
  }

  async getNotificationConfigByKey(key: string): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/key/${key}`, { method: 'GET' });
  }

  async createNotificationConfig(request: NotificationConfigRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/notificationConfig', { method: 'POST', body: JSON.stringify(request) });
  }

  async updateNotificationConfig(id: number, request: NotificationConfigRequest): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/${id}`, { method: 'PUT', body: JSON.stringify(request) });
  }

  async updateNotificationConfigActive(id: number, active: boolean): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/${id}/active`, { method: 'PUT', body: JSON.stringify(active) });
  }

  async getEmailConfigs(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<EmailConfigResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/emailConfig${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<EmailConfigResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getEmailConfigById(id: number): Promise<QrResponse<EmailConfigResponse>> {
    return this.request<EmailConfigResponse>(`/backoffice/api/emailConfig/${id}`, { method: 'GET' });
  }

  async getEmailConfigByKey(key: string): Promise<QrResponse<EmailConfigResponse>> {
    return this.request<EmailConfigResponse>(`/backoffice/api/emailConfig/key/${encodeURIComponent(key)}`, { method: 'GET' });
  }

  async createEmailConfig(request: EmailConfigRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/emailConfig', { method: 'POST', body: JSON.stringify(request) });
  }

  async updateEmailConfig(id: number, request: EmailConfigRequest): Promise<QrResponse<EmailConfigResponse>> {
    return this.request<EmailConfigResponse>(`/backoffice/api/emailConfig/${id}`, { method: 'PUT', body: JSON.stringify(request) });
  }

  async updateEmailConfigActive(id: number, active: boolean): Promise<QrResponse<EmailConfigResponse>> {
    return this.request<EmailConfigResponse>(`/backoffice/api/emailConfig/${id}/active`, { method: 'PUT', body: JSON.stringify(active) });
  }

  async sendEmailConfigTest(id: number, to: string): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/emailConfig/${id}/sendTest`, { method: 'POST', body: JSON.stringify({ to }) });
  }

  async getEmailLayoutConfig(): Promise<QrResponse<EmailLayoutConfigResponse>> {
    return this.request<EmailLayoutConfigResponse>('/backoffice/api/emailLayoutConfig', { method: 'GET' });
  }

  async getEmailLayoutConfigDefault(): Promise<QrResponse<EmailLayoutConfigResponse>> {
    return this.request<EmailLayoutConfigResponse>('/backoffice/api/emailLayoutConfig/default', { method: 'GET' });
  }

  async updateEmailLayoutConfig(request: EmailLayoutConfigRequest): Promise<QrResponse<EmailLayoutConfigResponse>> {
    return this.request<EmailLayoutConfigResponse>('/backoffice/api/emailLayoutConfig', { method: 'PUT', body: JSON.stringify(request) });
  }

  async getUserProfile(userId: number): Promise<QrResponse<UserProfileResponse>> {
    return this.request<UserProfileResponse>(`/backoffice/api/user/profile?userId=${userId}`, { method: 'GET' });
  }

  async getUsers(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<UserResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/user${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<UserResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getMigratedPersons(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<MigratedPersonResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/migratedPerson${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<MigratedPersonResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async updateUserRole(request: UserRoleUpdaterRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user/assign-role', { method: 'PUT', body: JSON.stringify(request) });
  }

  async updateUser(request: UserUpdateRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user', { method: 'PUT', body: JSON.stringify(request) });
  }

  async registerFcmToken(request: { fcmToken: string; platform?: string; deviceLabel?: string }): Promise<QrResponse<null>> {
    const { getPlatform } = await import('../services/firebase');
    const body: UserFcmTokenRequest = {
      fcmToken: request.fcmToken,
      platform: request.platform || getPlatform(),
      deviceLabel: request.deviceLabel || navigator.userAgent || 'Unknown Device',
    };
    try {
      return await this.request<null>('/backoffice/api/user/fcm-token', { method: 'POST', body: JSON.stringify(body) });
    } catch (error) {
      console.error('❌ [API] Error en registerFcmToken:', error);
      throw error;
    }
  }

  async getUserSessions(email?: string): Promise<QrResponse<UserSessionResponse[]>> {
    const endpoint = email ? `/backoffice/api/user/sessions?email=${encodeURIComponent(email)}` : '/backoffice/api/user/sessions';
    return this.request<UserSessionResponse[]>(endpoint, { method: 'GET' });
  }

  async revokeAllSessions(): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user/sessions/revoke-all', { method: 'POST' });
  }

  async getRoles(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<RoleResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/role${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<RoleResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getRoleById(roleId: number): Promise<QrResponse<RoleResponse>> {
    return this.request<RoleResponse>(`/backoffice/api/role/${roleId}`, { method: 'GET' });
  }

  async createRole(request: RoleRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/role', { method: 'POST', body: JSON.stringify(request) });
  }

  async updateRole(roleId: number, request: RoleRequest): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/role/${roleId}`, { method: 'PUT', body: JSON.stringify(request) });
  }

  async deleteRole(roleId: number): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/role/${roleId}`, { method: 'DELETE' });
  }

  async getPermissions(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<PermissionResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/permission${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<PermissionResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getPermissionById(permissionId: number): Promise<QrResponse<PermissionResponse>> {
    return this.request<PermissionResponse>(`/backoffice/api/permission/${permissionId}`, { method: 'GET' });
  }

  async createPermission(request: PermissionRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/permission', { method: 'POST', body: JSON.stringify(request) });
  }

  async updatePermission(permissionId: number, request: PermissionRequest): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/permission/${permissionId}`, { method: 'PUT', body: JSON.stringify(request) });
  }

  async deletePermission(permissionId: number): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/permission/${permissionId}`, { method: 'DELETE' });
  }

  async createTaskTypeRole(request: TaskTypeRoleRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/permits', { method: 'POST', body: JSON.stringify(request) });
  }

  async getApplications(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<ApplicationResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/application${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<ApplicationResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getApplicationById(applicationId: number): Promise<QrResponse<ApplicationFindResponse>> {
    return this.request<ApplicationFindResponse>(`/backoffice/api/application/${applicationId}`, { method: 'GET' });
  }

  async getStates(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<StateResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/state${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<StateResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getCities(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<CityResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/city${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<CityResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getNotaryOffices(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotaryOfficeResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/notaryOffice${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<NotaryOfficeResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getNotaryOfficeById(id: number): Promise<QrResponse<NotaryOfficeResponse>> {
    return this.request<NotaryOfficeResponse>(`/backoffice/api/notaryOffice/${id}`, { method: 'GET' });
  }

  async createNotaryOffice(request: NotaryOfficeRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/notaryOffice', { method: 'POST', body: JSON.stringify(request) });
  }

  async updateNotaryOffice(id: number, request: NotaryOfficeUpdateRequest): Promise<QrResponse<NotaryOfficeResponse>> {
    return this.request<NotaryOfficeResponse>(`/backoffice/api/notaryOffice/${id}`, { method: 'PUT', body: JSON.stringify(request) });
  }

  async getApplicationsReceived(params?: Record<string, string | string[]>): Promise<QrResponse<PaginationResponse<ApplicationReceivedResponse>>> {
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === '') continue;
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          if (v !== undefined && v !== '') searchParams.append(key, v);
        }
      }
      queryString = searchParams.toString();
    }
    const endpoint = `/backoffice/api/application-received${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<ApplicationReceivedResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getApplicationReceivedById(id: number): Promise<QrResponse<ApplicationReceivedResponse>> {
    return this.request<ApplicationReceivedResponse>(`/backoffice/api/application-received/${id}`, { method: 'GET' });
  }

  async getActions(): Promise<QrResponse<ActionResponse[]>> {
    return this.request<ActionResponse[]>(`/backoffice/api/action`, { method: 'GET' });
  }

  async getTaskConfigs(params?: Record<string, string | string[]>): Promise<QrResponse<PaginationResponse<TaskConfigListItem>>> {
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          if (v !== undefined && v !== '') searchParams.append(key, String(v));
        }
      }
      queryString = searchParams.toString();
    }
    const endpoint = `/backoffice/api/taskConfig${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<TaskConfigListItem>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getTaskConfigById(taskConfigId: number): Promise<QrResponse<FormResponse>> {
    return this.request<FormResponse>(`/backoffice/api/taskConfig/${taskConfigId}`, { method: 'GET' });
  }

  async getFormByTaskTypeId(taskTypeId: number): Promise<QrResponse<FormResponse>> {
    return this.request<FormResponse>(`/backoffice/api/form/${taskTypeId}`, { method: 'GET' });
  }

  async getTaskConfigActions(taskConfigId: number): Promise<QrResponse<TaskConfigActionsResponse>> {
    return this.request<TaskConfigActionsResponse>(`/backoffice/api/taskConfig/${taskConfigId}/actions`, { method: 'GET' });
  }

  async postTaskConfig(body: TaskConfigSaveRequest): Promise<QrResponse<unknown>> {
    return this.request<unknown>('/backoffice/api/taskConfig', { method: 'POST', body: JSON.stringify(body) });
  }

  async getTaskTypes(params?: Record<string, string | string[]>): Promise<QrResponse<PaginationResponse<Record<string, unknown>>>> {
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
          if (v !== undefined && v !== '') searchParams.append(key, String(v));
        }
      }
      queryString = searchParams.toString();
    }
    const endpoint = `/backoffice/api/taskType${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<Record<string, unknown>>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getRegions(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<RegionResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/region${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<RegionResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getRegionById(id: number): Promise<QrResponse<RegionResponse>> {
    return this.request<RegionResponse>(`/backoffice/api/region/${id}`, { method: 'GET' });
  }

  async createRegion(request: RegionRequest): Promise<QrResponse<RegionResponse>> {
    return this.request<RegionResponse>('/backoffice/api/region', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateRegion(id: number, request: RegionUpdateRequest): Promise<QrResponse<RegionResponse>> {
    return this.request<RegionResponse>(`/backoffice/api/region/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async getRegionCoverage(id: number): Promise<QrResponse<CoverageAreaResponse[]>> {
    return this.request<CoverageAreaResponse[]>(`/backoffice/api/region/${id}/coverage`, { method: 'GET' });
  }

  async updateRegionCoverage(id: number, areas: CoverageAreaRequest[]): Promise<QrResponse<CoverageAreaResponse[]>> {
    return this.request<CoverageAreaResponse[]>(`/backoffice/api/region/${id}/coverage`, {
      method: 'PUT',
      body: JSON.stringify(areas),
    });
  }

  async getFranchises(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<FranchiseResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/franchise${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<FranchiseResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async getFranchiseById(id: number): Promise<QrResponse<FranchiseResponse>> {
    return this.request<FranchiseResponse>(`/backoffice/api/franchise/${id}`, { method: 'GET' });
  }

  async createFranchise(request: FranchiseRequest): Promise<QrResponse<FranchiseResponse>> {
    return this.request<FranchiseResponse>('/backoffice/api/franchise', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateFranchise(id: number, request: FranchiseUpdateRequest): Promise<QrResponse<FranchiseResponse>> {
    return this.request<FranchiseResponse>(`/backoffice/api/franchise/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async getFranchiseCoverage(id: number): Promise<QrResponse<CoverageAreaResponse[]>> {
    return this.request<CoverageAreaResponse[]>(`/backoffice/api/franchise/${id}/coverage`, { method: 'GET' });
  }

  async updateFranchiseCoverage(id: number, areas: CoverageAreaRequest[]): Promise<QrResponse<CoverageAreaResponse[]>> {
    return this.request<CoverageAreaResponse[]>(`/backoffice/api/franchise/${id}/coverage`, {
      method: 'PUT',
      body: JSON.stringify(areas),
    });
  }

  async startNormalizeAddresses(): Promise<QrResponse<NormalizeAddressesJobStartResponse>> {
    return this.request<NormalizeAddressesJobStartResponse>('/backoffice/api/task/normalize-addresses', {
      method: 'POST',
    });
  }

  async getNormalizeAddressesJobStatus(jobId: string): Promise<QrResponse<NormalizeAddressesJobStatusResponse>> {
    return this.request<NormalizeAddressesJobStatusResponse>(
      `/backoffice/api/job/normalize-addresses/${jobId}`,
      { method: 'GET' }
    );
  }

  async getApplicationConfigLast(): Promise<QrResponse<ApplicationConfigResponse>> {
    return this.request<ApplicationConfigResponse>('/backoffice/api/applicationConfig/last', { method: 'GET' });
  }

  async getApplicationConfigList(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<ApplicationConfigResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/applicationConfig${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<ApplicationConfigResponse>>(endpoint, { method: 'GET' });
    if (response.data) return { ...response, data: this.normalizePaginationResponse(response.data) };
    return { ...response, data: null };
  }

  async createApplicationConfig(request: ApplicationConfigRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/applicationConfig', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}
