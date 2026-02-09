import type { UsersRepository } from '../repositories/users.repository';

export function createGetUserProfileUseCase(repo: UsersRepository) {
  return {
    async execute(userId: number) {
      return repo.getUserProfile(userId);
    },
  };
}

export function createGetUsersUseCase(repo: UsersRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getUsers(params);
    },
  };
}

export function createGetRolesUseCase(repo: UsersRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getRoles(params);
    },
  };
}

export function createGetPermissionsUseCase(repo: UsersRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getPermissions(params);
    },
  };
}

export function createGetUserSessionsUseCase(repo: UsersRepository) {
  return {
    async execute(email?: string) {
      return repo.getUserSessions(email);
    },
  };
}

export function createRevokeAllSessionsUseCase(repo: UsersRepository) {
  return {
    async execute() {
      return repo.revokeAllSessions();
    },
  };
}

export function createGetRoleByIdUseCase(repo: UsersRepository) {
  return {
    async execute(roleId: number) {
      return repo.getRoleById(roleId);
    },
  };
}

export function createCreateRoleUseCase(repo: UsersRepository) {
  return {
    async execute(request: Parameters<UsersRepository['createRole']>[1]) {
      return repo.createRole(request);
    },
  };
}

export function createUpdateRoleUseCase(repo: UsersRepository) {
  return {
    async execute(roleId: number, request: Parameters<UsersRepository['updateRole']>[1]) {
      return repo.updateRole(roleId, request);
    },
  };
}

export function createDeleteRoleUseCase(repo: UsersRepository) {
  return {
    async execute(roleId: number) {
      return repo.deleteRole(roleId);
    },
  };
}

export function createGetPermissionByIdUseCase(repo: UsersRepository) {
  return {
    async execute(permissionId: number) {
      return repo.getPermissionById(permissionId);
    },
  };
}

export function createCreatePermissionUseCase(repo: UsersRepository) {
  return {
    async execute(request: Parameters<UsersRepository['createPermission']>[0]) {
      return repo.createPermission(request);
    },
  };
}

export function createUpdatePermissionUseCase(repo: UsersRepository) {
  return {
    async execute(permissionId: number, request: Parameters<UsersRepository['updatePermission']>[1]) {
      return repo.updatePermission(permissionId, request);
    },
  };
}

export function createDeletePermissionUseCase(repo: UsersRepository) {
  return {
    async execute(permissionId: number) {
      return repo.deletePermission(permissionId);
    },
  };
}

export function createUpdateUserRoleUseCase(repo: UsersRepository) {
  return {
    async execute(request: Parameters<UsersRepository['updateUserRole']>[0]) {
      return repo.updateUserRole(request);
    },
  };
}
