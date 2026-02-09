import type {
  QrResponse,
  PaginationResponse,
  EmailConfigRequest,
  EmailConfigResponse,
  EmailLayoutConfigRequest,
  EmailLayoutConfigResponse,
} from '../types/dto';

export interface EmailConfigRepository {
  getEmailConfigs(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<EmailConfigResponse>>>;
  getEmailConfigById(id: number): Promise<QrResponse<EmailConfigResponse>>;
  getEmailConfigByKey(key: string): Promise<QrResponse<EmailConfigResponse>>;
  createEmailConfig(request: EmailConfigRequest): Promise<QrResponse<null>>;
  updateEmailConfig(id: number, request: EmailConfigRequest): Promise<QrResponse<EmailConfigResponse>>;
  updateEmailConfigActive(id: number, active: boolean): Promise<QrResponse<EmailConfigResponse>>;
  sendEmailConfigTest(id: number, to: string): Promise<QrResponse<null>>;
  getEmailLayoutConfig(): Promise<QrResponse<EmailLayoutConfigResponse>>;
  getEmailLayoutConfigDefault(): Promise<QrResponse<EmailLayoutConfigResponse>>;
  updateEmailLayoutConfig(request: EmailLayoutConfigRequest): Promise<QrResponse<EmailLayoutConfigResponse>>;
}
