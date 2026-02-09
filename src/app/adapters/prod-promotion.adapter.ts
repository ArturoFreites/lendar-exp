import type { AuthResponse, QrResponse } from '../types/dto';
import type {
  NotificationConfigRequest,
  FranchiseRequest,
  RegionRequest,
  NotaryOfficeRequest,
  EmailConfigRequest,
} from '../types/dto';
import type { ProdPromotionRepository } from '../repositories/prod-promotion.repository';
import type { ProdSession } from '../types/promotion';

function prodRequest<T>(
  session: ProdSession,
  path: string,
  body: T
): Promise<void> {
  const url = `${session.baseUrl.replace(/\/$/, '')}${path}`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  }).then((response) => {
    if (!response.ok) {
      return response.json().catch(() => ({})).then((err: { message?: string }) => {
        throw new Error(err.message || `Error ${response.status}: ${response.statusText}`);
      });
    }
  });
}

export class ProdPromotionAdapter implements ProdPromotionRepository {
  async loginToProd(baseUrl: string, email: string, password: string): Promise<ProdSession> {
    const url = `${baseUrl.replace(/\/$/, '')}/backoffice/api/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as QrResponse<AuthResponse>;
    if (!response.ok || !data.data?.tokens?.accessToken) {
      const message = data.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }
    return {
      accessToken: data.data.tokens.accessToken,
      email: data.data.email,
      baseUrl,
    };
  }

  async createNotificationConfigInProd(
    session: ProdSession,
    body: NotificationConfigRequest
  ): Promise<void> {
    return prodRequest(session, '/backoffice/api/notificationConfig', body);
  }

  async createFranchiseInProd(session: ProdSession, body: FranchiseRequest): Promise<void> {
    return prodRequest(session, '/backoffice/api/franchise', body);
  }

  async createRegionInProd(session: ProdSession, body: RegionRequest): Promise<void> {
    return prodRequest(session, '/backoffice/api/region', body);
  }

  async createNotaryOfficeInProd(session: ProdSession, body: NotaryOfficeRequest): Promise<void> {
    return prodRequest(session, '/backoffice/api/notaryOffice', body);
  }

  async createEmailConfigInProd(session: ProdSession, body: EmailConfigRequest): Promise<void> {
    return prodRequest(session, '/backoffice/api/emailConfig', body);
  }
}
