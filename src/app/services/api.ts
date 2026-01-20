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
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Importante para cookies
    });

    // Si recibimos un 403 y no es el endpoint de refresh ni login, intentar refrescar el token
    if (response.status === 403 && retryOn403 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      // Guardar el error original antes de intentar refresh
      const errorDataPromise = response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
      }));
      
      const refreshSuccess = await this.refreshToken();
      
      if (refreshSuccess) {
        // Reintentar la petición original una vez
        return this.request<T>(endpoint, options, false);
      } else {
        // Si el refresh falla, lanzar el error original
        const errorData = await errorDataPromise;
        throw new Error(errorData.message || `Error ${response.status}: Token expirado. Por favor, inicia sesión nuevamente.`);
      }
    }

    if (!response.ok && response.status !== 200 && response.status !== 201) {
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.message || `Error ${response.status}`);
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

  async login(email: string, password: string, fcmToken?: string, platform?: string): Promise<QrResponse<AuthResponse>> {
    const body: AuthRequest = {
      email,
      password,
      ...(fcmToken && { fcmToken }),
      ...(platform && { platform }),
    };

    console.log('📤 Request de login:', {
      email,
      hasPassword: !!password,
      hasFcmToken: !!fcmToken,
      fcmToken: fcmToken ? fcmToken.substring(0, 30) + '...' : 'null',
      platform,
    });
    console.log('📦 Body completo:', JSON.stringify(body, null, 2));

    return this.request<AuthResponse>('/backoffice/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
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

  async registerFcmToken(request: UserFcmTokenRequest): Promise<QrResponse<null>> {
    return this.request<null>('/backoffice/api/user/fcm-token', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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
}

export const createApiService = (baseUrl: string) => new ApiService(baseUrl);
