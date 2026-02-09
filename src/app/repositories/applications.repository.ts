import type {
  QrResponse,
  PaginationResponse,
  ApplicationResponse,
  ApplicationFindResponse,
  ApplicationReceivedResponse,
} from '../types/dto';

export interface ApplicationsRepository {
  getApplications(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<ApplicationResponse>>>;
  getApplicationById(applicationId: number): Promise<QrResponse<ApplicationFindResponse>>;
  getApplicationsReceived(params?: Record<string, string | string[]>): Promise<QrResponse<PaginationResponse<ApplicationReceivedResponse>>>;
  getApplicationReceivedById(id: number): Promise<QrResponse<ApplicationReceivedResponse>>;
}
