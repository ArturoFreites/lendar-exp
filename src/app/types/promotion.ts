export type PromoteableType =
  | 'notification_config'
  | 'franchise'
  | 'region'
  | 'notary_office'
  | 'email_config';

export interface ProdSession {
  accessToken: string;
  email: string;
  baseUrl: string;
}

export interface PromotionSummaryItem {
  type: PromoteableType;
  label: string;
  detail: string;
}

export interface PendingPromotion {
  type: PromoteableType;
  payload: unknown;
}
