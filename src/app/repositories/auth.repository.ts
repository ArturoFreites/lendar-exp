import type { QrResponse, AuthResponse } from '../types/dto';

export interface AuthRepository {
  getBaseUrl(): string;
  login(email: string, password: string): Promise<QrResponse<AuthResponse>>;
  logout(): Promise<QrResponse<null>>;
}
