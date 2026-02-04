import { triggerGlobalError } from '../utils/globalErrorHandler';
import { triggerSessionInvalid } from '../utils/sessionInvalidHandler';

interface QrResponse<T> {
  data: T | null;
  code: number;
  message: string;
  errors: string[] | null;
}

interface AuthRequest {
  email: string;
  password: string;
  fcmToken?: string;
  platform?: string;
}

interface TokenBundleResponse {
  tokenType: string;
  accessToken: string;
  accessJti: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshJti: string;
  familyId: string;
  expiresInSeconds: number;
}

export interface AuthResponse {
  id: number;
  name: string;
  lastName: string;
  email: string;
  tokens: TokenBundleResponse;
  roles: string[];
  confirmEmail: boolean;
}

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  deepLink: string | null;
  metadata: any;
  createdAt: string;
  readAt: string | null;
  sentPushAt: string | null;
  sentEmailAt: string | null;
}

// Respuesta del backend para listas paginadas
export interface BackendPaginationResponse<T> {
  results: T[];
  page: number;
  totalItems: number;
  totalPages: number;
}

// Interfaz normalizada para uso interno
export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface NotificationConfigRequest {
  key: string;
  titleTemplate: string;
  messageTemplate: string;
  deepLinkTemplate?: string | null;
  metadataTemplate?: any | null;
}

export interface NotificationConfigResponse {
  id: number;
  key: string;
  titleTemplate: string;
  messageTemplate: string;
  deepLinkTemplate: string | null;
  metadataTemplate: any | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailConfigRequest {
  key: string;
  description?: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface EmailConfigResponse {
  id: number;
  key: string;
  description: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLayoutConfigRequest {
  headerHtml: string;
  footerHtml: string;
}

export interface EmailLayoutConfigResponse {
  id: number | null;
  headerHtml: string;
  footerHtml: string;
  updatedAt: string | null;
}

export interface UserProfileResponse {
  userId: number;
  email: string;
  name: string;
  lastName: string;
  createdAt: string;
  confirmEmail: boolean;
  enable: boolean;
  roles: string[];
  client: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    createdAt: string;
  } | null;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  lastName: string;
  createdAt: string;
  roles: RoleResponse[];
}

export interface RoleResponse {
  id: number;
  name: string;
  permissions?: PermissionResponse[];
}

export interface PermissionResponse {
  id: number;
  name: string;
  description?: string;
}

export interface RoleRequest {
  name: string;
  permissionIds: number[];
}

export interface UserRoleUpdaterRequest {
  type: string;
  userId: number;
}

export interface PermissionRequest {
  name: string;
  description?: string;
}

export interface UserUpdateRequest {
  userId: number;
  name: string;
  lastName: string;
  email?: string;
  birthday?: string;
  phone?: string;
  nationality?: string;
  gender?: string;
  cuit?: string;
  socialReason?: string;
}

export interface UserFcmTokenRequest {
  fcmToken: string;
  platform: string;
  deviceLabel: string;
}

export interface TaskTypeRoleRequest {
  type: string;
  roleIds: number[];
  taskTypeId: number;
}

// Application (registro de ingresos / solicitudes)
export interface ApplicationResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  quotaValue: number | null;
  amount: number | null;
  percentageAmount: number | null;
  term: string | null;
  propertyValue: number | null;
  reserved: boolean | null;
  officeRemaxName: string | null;
  operationType: string | null;
  remaxContact: boolean | null;
  propertyRemax: boolean | null;
  spouse: string | null;
  taskTypeName: string | null;
  stage: string | null;
  status: string | null;
  subStatus: string | null;
  reason: string | null;
  contractUrl: string | null;
  applicationConfigId: number | null;
  region: Record<string, unknown> | null;
  notaryOffice: Record<string, unknown> | null;
  clients: ApplicationClientResponse[] | null;
  cbu: string | null;
  bcraBackground: boolean | null;
  politicallyExposed: boolean | null;
  civilStatus: string | null;
  residenceAddress: Record<string, unknown> | null;
}

export interface ApplicationClientResponse {
  client: Record<string, unknown>;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApplicationFindResponse extends ApplicationResponse {
  fee?: number;
}

// Application Received (entradas del application-receiver)
export interface ApplicationReceivedResponse {
  id: number;
  detail: string | null;
  status: string | null;
  content: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuthSessionResponse {
  familyId: string;
  userId: number;
  deviceLabel: string;
  firstSeenAt: string;
  lastRefreshAt: string;
  lastIp: string;
  lastUserAgent: string;
}

export interface DeviceFcmTokenInfo {
  id: number;
  fcmToken: string;
  platform: string | null;
  deviceLabel: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

export interface UserSessionResponse {
  familyId: string;
  userId: number;
  deviceLabel: string;
  firstSeenAt: string;
  lastRefreshAt: string;
  lastIp: string;
  lastUserAgent: string;
  fcmTokens: DeviceFcmTokenInfo[];
}

class ApiService {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async refreshToken(): Promise<boolean> {
    // Si ya hay un refresh en curso, esperar a que termine
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        // Importar funciones de Firebase dinámicamente para evitar dependencias circulares
        const { getFCMToken, getPlatform } = await import('./firebase');
        
        let fcmToken: string | null = null;
        try {
          fcmToken = await getFCMToken();
        } catch (error) {
          console.warn('No se pudo obtener token FCM para refresh:', error);
        }

        const platform = getPlatform();
        const body: any = {};
        if (fcmToken) {
          body.fcmToken = fcmToken;
        }
        if (platform) {
          body.platform = platform;
        }

        const requestOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        };

        // Solo incluir body si tiene contenido
        if (Object.keys(body).length > 0) {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}/backoffice/api/auth/refresh`, requestOptions);

        if (response.ok) {
          // Las cookies se actualizan automáticamente
          return true;
        } else {
          console.error('Error al refrescar token:', response.status);
          return false;
        }
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
    retryOn403: boolean = true
  ): Promise<QrResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Log para FCM
    const isFcmRequest = endpoint.includes('/fcm-token');
    if (isFcmRequest) {
      console.log('🌐 [REQUEST] Iniciando petición FCM:', {
        url,
        method: options.method || 'GET',
        hasBody: !!options.body,
        bodyPreview: options.body ? (typeof options.body === 'string' ? options.body.substring(0, 100) + '...' : 'Object') : undefined
      });
    }
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    let response: Response;
    try {
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        credentials: 'include', // Importante para cookies
      };
      
      if (isFcmRequest) {
        console.log('🌐 [REQUEST] Opciones de fetch:', {
          method: fetchOptions.method,
          headers: fetchOptions.headers,
          hasBody: !!fetchOptions.body,
          credentials: fetchOptions.credentials
        });
      }
      
      response = await fetch(url, fetchOptions);
      
      if (isFcmRequest) {
        console.log('🌐 [REQUEST] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }
    } catch (networkError) {
      // Error de red (sin conexión, timeout, etc.)
      const errorMessage = networkError instanceof Error 
        ? networkError.message 
        : 'Error de conexión. Verifica tu conexión a internet.';
      const error = {
        message: errorMessage,
        code: 0,
        isNetworkError: true,
      };
      
      // Disparar error global
      triggerGlobalError({
        title: 'Error de conexión',
        message: errorMessage,
        code: 0,
      });
      
      throw error;
    }

    // Si recibimos 401 o 403 (token expirado/inválido) y no es refresh ni login, intentar refrescar el token
    const isAuthError = (response.status === 401 || response.status === 403) && retryOn403
      && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login');

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
        message: errorData.message || (response.status === 401
          ? 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          : `Error ${response.status}: ${response.statusText}`),
        code: response.status,
        errors: errorData.errors ?? null,
      };

      triggerGlobalError({
        title: 'Sesión inválida',
        message: error.message,
        code: error.code,
        errors: error.errors || undefined,
      });

      if (response.status === 401) {
        triggerSessionInvalid();
      }

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
      
      // Disparar error global (excepto para FCM que se maneja específicamente)
      // Verificar si es el endpoint de FCM
      const isFcmEndpoint = endpoint.includes('/fcm-token');
      if (!isFcmEndpoint) {
        triggerGlobalError({
          title: 'Error en la petición',
          message: error.message,
          code: error.code,
          errors: error.errors || undefined,
        });
      }
      
      throw error;
    }

    return response.json();
  }

  // Normaliza las respuestas paginadas del backend a la estructura interna
  private normalizePaginationResponse<T>(
    backendResponse: BackendPaginationResponse<T>
  ): PaginationResponse<T> {
    return {
      content: backendResponse.results || [],
      totalElements: backendResponse.totalItems || 0,
      totalPages: backendResponse.totalPages || 0,
      size: backendResponse.results?.length || 0,
      number: backendResponse.page || 0,
    };
  }

  async login(email: string, password: string): Promise<QrResponse<AuthResponse>> {
    const body: AuthRequest = {
      email,
      password,
    };

    console.log('📤 Request de login:', {
      email,
      hasPassword: !!password,
    });

    return this.request<AuthResponse>('/backoffice/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async logout(): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getNotifications(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotificationResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/notification${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<BackendPaginationResponse<NotificationResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async markNotificationAsRead(id: number): Promise<QrResponse<NotificationResponse>> {
    return this.request<NotificationResponse>(`/backoffice/api/notification/${id}/read`, {
      method: 'PUT',
    });
  }

  // NotificationConfig methods
  async getNotificationConfigs(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotificationConfigResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/notificationConfig${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<BackendPaginationResponse<NotificationConfigResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async getNotificationConfigById(id: number): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/${id}`, {
      method: 'GET',
    });
  }

  async getNotificationConfigByKey(key: string): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/key/${key}`, {
      method: 'GET',
    });
  }

  async createNotificationConfig(request: NotificationConfigRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/notificationConfig', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateNotificationConfig(id: number, request: NotificationConfigRequest): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async updateNotificationConfigActive(id: number, active: boolean): Promise<QrResponse<NotificationConfigResponse>> {
    return this.request<NotificationConfigResponse>(`/backoffice/api/notificationConfig/${id}/active`, {
      method: 'PUT',
      body: JSON.stringify(active),
    });
  }

  // EmailConfig methods
  async getEmailConfigs(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<EmailConfigResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/emailConfig${queryString ? `?${queryString}` : ''}`;
    const response = await this.request<BackendPaginationResponse<EmailConfigResponse>>(endpoint, { method: 'GET' });
    if (response.data) {
      return { ...response, data: this.normalizePaginationResponse(response.data) };
    }
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
    return this.request<null>(`/backoffice/api/emailConfig/${id}/sendTest`, {
      method: 'POST',
      body: JSON.stringify({ to }),
    });
  }

  // EmailLayoutConfig methods
  async getEmailLayoutConfig(): Promise<QrResponse<EmailLayoutConfigResponse>> {
    return this.request<EmailLayoutConfigResponse>('/backoffice/api/emailLayoutConfig', { method: 'GET' });
  }

  async getEmailLayoutConfigDefault(): Promise<QrResponse<EmailLayoutConfigResponse>> {
    return this.request<EmailLayoutConfigResponse>('/backoffice/api/emailLayoutConfig/default', { method: 'GET' });
  }

  async updateEmailLayoutConfig(request: EmailLayoutConfigRequest): Promise<QrResponse<EmailLayoutConfigResponse>> {
    return this.request<EmailLayoutConfigResponse>('/backoffice/api/emailLayoutConfig', { method: 'PUT', body: JSON.stringify(request) });
  }

  // User methods
  async getUserProfile(userId: number): Promise<QrResponse<UserProfileResponse>> {
    return this.request<UserProfileResponse>(`/backoffice/api/user/profile?userId=${userId}`, {
      method: 'GET',
    });
  }

  async getUsers(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<UserResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/user${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<BackendPaginationResponse<UserResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async updateUserRole(request: UserRoleUpdaterRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user/role', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async updateUser(request: UserUpdateRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user', {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async registerFcmToken(request: { fcmToken: string; platform?: string; deviceLabel?: string }): Promise<QrResponse<null>> {
    console.log('📤 [API] registerFcmToken llamado con:', {
      fcmToken: request.fcmToken?.substring(0, 30) + '...',
      platform: request.platform,
      deviceLabel: request.deviceLabel?.substring(0, 50) + '...'
    });

    // Importar funciones de Firebase dinámicamente
    const { getPlatform } = await import('./firebase');
    
    const body: UserFcmTokenRequest = {
      fcmToken: request.fcmToken,
      platform: request.platform || getPlatform(),
      deviceLabel: request.deviceLabel || navigator.userAgent || 'Unknown Device',
    };

    console.log('📤 [API] Body a enviar:', {
      fcmToken: body.fcmToken?.substring(0, 30) + '...',
      platform: body.platform,
      deviceLabel: body.deviceLabel?.substring(0, 50) + '...'
    });

    const endpoint = '/backoffice/api/user/fcm-token';
    console.log('📤 [API] Endpoint:', endpoint);
    console.log('📤 [API] Base URL:', this.baseUrl);
    console.log('📤 [API] URL completa:', `${this.baseUrl}${endpoint}`);

    try {
      const response = await this.request<null>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      console.log('✅ [API] registerFcmToken respuesta exitosa:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [API] Error en registerFcmToken:', error);
      // Para errores de FCM, no disparar error global automáticamente
      // porque se maneja específicamente en AuthContext
      // Solo re-lanzar el error para que AuthContext lo capture
      throw error;
    }
  }

  // Session methods
  async getUserSessions(email?: string): Promise<QrResponse<UserSessionResponse[]>> {
    const endpoint = email 
      ? `/backoffice/api/user/sessions?email=${encodeURIComponent(email)}`
      : '/backoffice/api/user/sessions';
    return this.request<UserSessionResponse[]>(endpoint, {
      method: 'GET',
    });
  }

  async revokeAllSessions(): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user/sessions/revoke-all', {
      method: 'POST',
    });
  }

  // Role methods
  async getRoles(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<RoleResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/role${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<BackendPaginationResponse<RoleResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async getRoleById(roleId: number): Promise<QrResponse<RoleResponse>> {
    return this.request<RoleResponse>(`/backoffice/api/role/${roleId}`, {
      method: 'GET',
    });
  }

  async createRole(request: RoleRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/role', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateRole(roleId: number, request: RoleRequest): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/role/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteRole(roleId: number): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/role/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Permission methods
  async getPermissions(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<PermissionResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/permission${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<BackendPaginationResponse<PermissionResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async getPermissionById(permissionId: number): Promise<QrResponse<PermissionResponse>> {
    return this.request<PermissionResponse>(`/backoffice/api/permission/${permissionId}`, {
      method: 'GET',
    });
  }

  async createPermission(request: PermissionRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/permission', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updatePermission(permissionId: number, request: PermissionRequest): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/permission/${permissionId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deletePermission(permissionId: number): Promise<QrResponse<null>> {
    return this.request<null>(`/backoffice/api/permission/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // TaskTypeRole methods
  async createTaskTypeRole(request: TaskTypeRoleRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/permits', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Application (registro de ingresos) methods
  async getApplications(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<ApplicationResponse>>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = `/backoffice/api/application${queryString ? `?${queryString}` : ''}`;

    const response = await this.request<BackendPaginationResponse<ApplicationResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async getApplicationById(applicationId: number): Promise<QrResponse<ApplicationFindResponse>> {
    return this.request<ApplicationFindResponse>(`/backoffice/api/application/${applicationId}`, {
      method: 'GET',
    });
  }

  // Application Received (application-receiver) methods.
  // Params may include page, size, sort, and filter ops: eq, contains, gte, lte (e.g. eq=status:ok, contains=detail:text, gte=createdAt:ISO, lte=createdAt:ISO).
  async getApplicationsReceived(params?: Record<string, string | string[]>) {
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

    const response = await this.request<BackendPaginationResponse<ApplicationReceivedResponse>>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return {
        ...response,
        data: this.normalizePaginationResponse(response.data),
      };
    }

    return {
      ...response,
      data: null,
    };
  }

  async getApplicationReceivedById(id: number): Promise<QrResponse<ApplicationReceivedResponse>> {
    return this.request<ApplicationReceivedResponse>(`/backoffice/api/application-received/${id}`, {
      method: 'GET',
    });
  }
}

export const createApiService = (baseUrl: string) => new ApiService(baseUrl);
