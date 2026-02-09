import type { ProdPromotionRepository } from '../repositories/prod-promotion.repository';
import {
  getCreatePayloadForType,
  type PromoteCreateBody,
} from '../repositories/prod-promotion.repository';
import type { ProdSession, PromoteableType, PromotionSummaryItem } from '../types/promotion';
import type {
  NotificationConfigRequest,
  FranchiseRequest,
  RegionRequest,
  NotaryOfficeRequest,
  EmailConfigRequest,
} from '../types/dto';

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

export function buildPromotionSummary(type: PromoteableType, payload: unknown): PromotionSummaryItem | null {
  if (type === 'notification_config') {
    const p = payload as NotificationConfigRequest;
    if (!p || typeof p.key !== 'string') return null;
    const titlePreview = typeof p.titleTemplate === 'string' ? truncate(p.titleTemplate, 50) : '';
    return {
      type: 'notification_config',
      label: 'Configuración de notificación',
      detail: `${p.key}${titlePreview ? ` — ${titlePreview}` : ''}`,
    };
  }
  if (type === 'franchise') {
    const p = payload as FranchiseRequest;
    if (!p || typeof p.name !== 'string') return null;
    return { type: 'franchise', label: 'Franquicia', detail: p.name };
  }
  if (type === 'region') {
    const p = payload as RegionRequest;
    if (!p || typeof p.name !== 'string') return null;
    return { type: 'region', label: 'Región', detail: p.name };
  }
  if (type === 'notary_office') {
    const p = payload as NotaryOfficeRequest & { name: string };
    if (!p || typeof p.name !== 'string') return null;
    return { type: 'notary_office', label: 'Escribanía', detail: p.name };
  }
  if (type === 'email_config') {
    const p = payload as EmailConfigRequest;
    if (!p || typeof p.key !== 'string') return null;
    const subjectPreview = typeof p.subjectTemplate === 'string' ? truncate(p.subjectTemplate, 40) : '';
    return {
      type: 'email_config',
      label: 'Configuración de email',
      detail: `${p.key}${subjectPreview ? ` — ${subjectPreview}` : ''}`,
    };
  }
  return null;
}

export function createPromoteToProdUseCase(repo: ProdPromotionRepository) {
  return {
    async execute(
      type: PromoteableType,
      payload: unknown,
      session: ProdSession
    ): Promise<void> {
      const body = getCreatePayloadForType(type, payload) as PromoteCreateBody | null;
      if (!body) throw new Error('Payload inválido para el tipo seleccionado');
      switch (type) {
        case 'notification_config':
          await repo.createNotificationConfigInProd(session, body as NotificationConfigRequest);
          break;
        case 'franchise':
          await repo.createFranchiseInProd(session, body as FranchiseRequest);
          break;
        case 'region':
          await repo.createRegionInProd(session, body as RegionRequest);
          break;
        case 'notary_office':
          await repo.createNotaryOfficeInProd(session, body as NotaryOfficeRequest);
          break;
        case 'email_config':
          await repo.createEmailConfigInProd(session, body as EmailConfigRequest);
          break;
      }
    },
  };
}
