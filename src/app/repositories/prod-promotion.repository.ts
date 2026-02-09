import type {
  NotificationConfigRequest,
  FranchiseRequest,
  RegionRequest,
  NotaryOfficeRequest,
  EmailConfigRequest,
  AddressRequest,
} from '../types/dto';
import type { AddressResponse, CityResponse, StateResponse } from '../types/dto';
import type { ProdSession, PromoteableType } from '../types/promotion';

export type PromoteCreateBody =
  | NotificationConfigRequest
  | FranchiseRequest
  | RegionRequest
  | NotaryOfficeRequest
  | EmailConfigRequest;

export interface ProdPromotionRepository {
  loginToProd(baseUrl: string, email: string, password: string): Promise<ProdSession>;
  createNotificationConfigInProd(session: ProdSession, body: NotificationConfigRequest): Promise<void>;
  createFranchiseInProd(session: ProdSession, body: FranchiseRequest): Promise<void>;
  createRegionInProd(session: ProdSession, body: RegionRequest): Promise<void>;
  createNotaryOfficeInProd(session: ProdSession, body: NotaryOfficeRequest): Promise<void>;
  createEmailConfigInProd(session: ProdSession, body: EmailConfigRequest): Promise<void>;
}

function addressResponseToRequest(addr: AddressResponse | null | undefined): AddressRequest {
  if (!addr) return { cityId: null, stateId: 0 };
  const city = addr.city as CityResponse | null | undefined;
  const state = addr.state as StateResponse | null | undefined;
  return {
    cityId: city?.id ?? null,
    stateId: state?.id ?? 0,
    street: addr.street ?? null,
    streetNumber: addr.streetNumber ?? null,
    neighborhood: addr.neighborhood ?? null,
    floor: addr.floor ?? null,
    department: addr.department ?? null,
    postalCode: addr.postalCode ?? null,
  };
}

export function getCreatePayloadForType(
  type: PromoteableType,
  payload: unknown
): PromoteCreateBody | null {
  if (type === 'notification_config') {
    const p = payload as NotificationConfigRequest;
    if (
      !p ||
      typeof p.key !== 'string' ||
      typeof p.titleTemplate !== 'string' ||
      typeof p.messageTemplate !== 'string'
    )
      return null;
    return {
      key: p.key,
      titleTemplate: p.titleTemplate,
      messageTemplate: p.messageTemplate,
      deepLinkTemplate: p.deepLinkTemplate ?? undefined,
      metadataTemplate: p.metadataTemplate ?? undefined,
    };
  }
  if (type === 'franchise') {
    const p = payload as FranchiseRequest;
    if (!p || typeof p.name !== 'string') return null;
    return {
      name: p.name,
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      responsible: p.responsible ?? undefined,
      coverage: Array.isArray(p.coverage) ? p.coverage : [],
    };
  }
  if (type === 'region') {
    const p = payload as RegionRequest;
    if (!p || typeof p.name !== 'string') return null;
    return {
      name: p.name,
      address: p.address ?? null,
      coverage: Array.isArray(p.coverage) ? p.coverage : [],
    };
  }
  if (type === 'notary_office') {
    const p = payload as { name: string; address?: AddressResponse | null };
    if (!p || typeof p.name !== 'string') return null;
    return {
      name: p.name,
      address: addressResponseToRequest(p.address),
    };
  }
  if (type === 'email_config') {
    const p = payload as EmailConfigRequest;
    if (!p || typeof p.key !== 'string' || typeof p.subjectTemplate !== 'string' || typeof p.bodyTemplate !== 'string')
      return null;
    return {
      key: p.key,
      description: p.description ?? undefined,
      subjectTemplate: p.subjectTemplate,
      bodyTemplate: p.bodyTemplate,
    };
  }
  return null;
}
