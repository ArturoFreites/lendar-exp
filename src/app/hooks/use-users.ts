import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetUserProfileUseCase,
  createGetUsersUseCase,
  createGetRolesUseCase,
  createGetPermissionsUseCase,
  createGetUserSessionsUseCase,
  createRevokeAllSessionsUseCase,
  createGetRoleByIdUseCase,
  createCreateRoleUseCase,
  createUpdateRoleUseCase,
  createDeleteRoleUseCase,
  createGetPermissionByIdUseCase,
  createCreatePermissionUseCase,
  createUpdatePermissionUseCase,
  createDeletePermissionUseCase,
  createCreateUserUseCase,
  createUpdateUserRoleUseCase,
  createUpdateUserUseCase,
  createSendPasswordResetUseCase,
} from '../usecases/users.usecases';

export function useUsers() {
  const { apiService } = useAuth();

  const getUserProfile = useCallback(
    async (userId: number) => {
      if (!apiService) return null;
      return createGetUserProfileUseCase(apiService).execute(userId);
    },
    [apiService]
  );

  const getUsers = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetUsersUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getRoles = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetRolesUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getPermissions = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetPermissionsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getUserSessions = useCallback(
    async (email?: string) => {
      if (!apiService) return null;
      return createGetUserSessionsUseCase(apiService).execute(email);
    },
    [apiService]
  );

  const revokeAllSessions = useCallback(async () => {
    if (!apiService) return null;
    return createRevokeAllSessionsUseCase(apiService).execute();
  }, [apiService]);

  const getRoleById = useCallback(
    async (roleId: number) => {
      if (!apiService) return null;
      return createGetRoleByIdUseCase(apiService).execute(roleId);
    },
    [apiService]
  );

  const createRole = useCallback(
    async (request: { name: string; permissionIds: number[] }) => {
      if (!apiService) return null;
      return createCreateRoleUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateRole = useCallback(
    async (roleId: number, request: { name: string; permissionIds: number[] }) => {
      if (!apiService) return null;
      return createUpdateRoleUseCase(apiService).execute(roleId, request);
    },
    [apiService]
  );

  const deleteRole = useCallback(
    async (roleId: number) => {
      if (!apiService) return null;
      return createDeleteRoleUseCase(apiService).execute(roleId);
    },
    [apiService]
  );

  const getPermissionById = useCallback(
    async (permissionId: number) => {
      if (!apiService) return null;
      return createGetPermissionByIdUseCase(apiService).execute(permissionId);
    },
    [apiService]
  );

  const createPermission = useCallback(
    async (request: { name: string; description?: string }) => {
      if (!apiService) return null;
      return createCreatePermissionUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updatePermission = useCallback(
    async (permissionId: number, request: { name: string; description?: string }) => {
      if (!apiService) return null;
      return createUpdatePermissionUseCase(apiService).execute(permissionId, request);
    },
    [apiService]
  );

  const deletePermission = useCallback(
    async (permissionId: number) => {
      if (!apiService) return null;
      return createDeletePermissionUseCase(apiService).execute(permissionId);
    },
    [apiService]
  );

  const createUser = useCallback(
    async (request: { name: string; lastName: string; email: string; password: string; dni: string }) => {
      if (!apiService) return null;
      return createCreateUserUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateUserRole = useCallback(
    async (request: { userId: number; roleIds: number[] }) => {
      if (!apiService) return null;
      return createUpdateUserRoleUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateUser = useCallback(
    async (request: Parameters<ReturnType<typeof createUpdateUserUseCase>['execute']>[0]) => {
      if (!apiService) return null;
      return createUpdateUserUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (!apiService) return null;
      return createSendPasswordResetUseCase(apiService).execute(email);
    },
    [apiService]
  );

  return {
    getUserProfile,
    getUsers,
    createUser,
    getRoles,
    getPermissions,
    getUserSessions,
    revokeAllSessions,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
    updateUserRole,
    updateUser,
    sendPasswordReset,
    hasApi: !!apiService,
  };
}
