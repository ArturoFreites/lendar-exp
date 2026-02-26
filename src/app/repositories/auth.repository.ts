import type { QrResponse, AuthResponse } from '../types/dto';

export interface RefreshSessionResult {
  success: boolean;
  expiresInSeconds?: number;
}

export interface AuthRepository {
  getBaseUrl(): string;
  login(email: string, password: string): Promise<QrResponse<AuthResponse>>;
  logout(): Promise<QrResponse<null>>;
  refreshSession(): Promise<RefreshSessionResult>;
  /** Logout on BE only (raw POST). Use when refresh failed and access token may be expired. */
  logoutOnBackend(): Promise<void>;
}
