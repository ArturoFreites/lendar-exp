import type { AuthRepository } from '../repositories/auth.repository';

export interface LoginViewUser {
  id: number;
  name: string;
  lastName: string;
  email: string;
  roles: string[];
  confirmEmail: boolean;
}

export interface LoginResult {
  success: true;
  user: LoginViewUser;
  accessTokenTtlSeconds?: number;
}

export interface LoginError {
  success: false;
  errorMessage: string;
}

export type LoginView = LoginResult | LoginError;

export function createLoginUseCase(api: AuthRepository) {
  return {
    async execute(email: string, password: string): Promise<LoginView> {
      const response = await api.login(email, password);
      if (response.code === 200 && response.data) {
        const authData = response.data;
        return {
          success: true,
          user: {
            id: authData.id,
            name: authData.name,
            lastName: authData.lastName,
            email: authData.email,
            roles: authData.roles,
            confirmEmail: authData.confirmEmail,
          },
          accessTokenTtlSeconds: authData.tokens?.expiresInSeconds,
        };
      }
      return {
        success: false,
        errorMessage: response.message || 'Error al iniciar sesión',
      };
    },
  };
}
