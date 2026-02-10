import type {
  QrResponse,
  PaginationResponse,
  ApplicationConfigResponse,
  ApplicationConfigRequest,
} from '../types/dto';

export interface ApplicationConfigRepository {
  getApplicationConfigLast(): Promise<QrResponse<ApplicationConfigResponse>>;
  getApplicationConfigList(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<ApplicationConfigResponse>>>;
  createApplicationConfig(request: ApplicationConfigRequest): Promise<QrResponse<null>>;
}
