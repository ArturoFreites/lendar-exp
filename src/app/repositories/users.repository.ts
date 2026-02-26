import type {
  QrResponse,
  PaginationResponse,
  UserProfileResponse,
  UserResponse,
  UserRoleUpdaterRequest,
  UserCreateRequest,
  UserUpdateRequest,
  UserSessionResponse,
  RoleResponse,
  RoleRequest,
  PermissionResponse,
  PermissionRequest,
  TaskTypeRoleRequest,
} from '../types/dto';

export interface UsersRepository {
  getUserProfile(userId: number): Promise<QrResponse<UserProfileResponse>>;
  getUsers(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<UserResponse>>>;
  createUser(request: UserCreateRequest): Promise<QrResponse<null>>;
  updateUserRole(request: UserRoleUpdaterRequest): Promise<QrResponse<null>>;
  updateUser(request: UserUpdateRequest): Promise<QrResponse<null>>;
  registerFcmToken(request: { fcmToken: string; platform?: string; deviceLabel?: string }): Promise<QrResponse<null>>;
  getUserSessions(email?: string): Promise<QrResponse<UserSessionResponse[]>>;
  revokeAllSessions(): Promise<QrResponse<null>>;
  getRoles(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<RoleResponse>>>;
  getRoleById(roleId: number): Promise<QrResponse<RoleResponse>>;
  createRole(request: RoleRequest): Promise<QrResponse<null>>;
  updateRole(roleId: number, request: RoleRequest): Promise<QrResponse<null>>;
  deleteRole(roleId: number): Promise<QrResponse<null>>;
  getPermissions(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<PermissionResponse>>>;
  getPermissionById(permissionId: number): Promise<QrResponse<PermissionResponse>>;
  createPermission(request: PermissionRequest): Promise<QrResponse<null>>;
  updatePermission(permissionId: number, request: PermissionRequest): Promise<QrResponse<null>>;
  deletePermission(permissionId: number): Promise<QrResponse<null>>;
  createTaskTypeRole(request: TaskTypeRoleRequest): Promise<QrResponse<null>>;
}
