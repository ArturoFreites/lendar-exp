import type {
  QrResponse,
  PaginationResponse,
  StateResponse,
  CityResponse,
  NotaryOfficeResponse,
  NotaryOfficeRequest,
  NotaryOfficeUpdateRequest,
} from '../types/dto';

export interface NotaryOfficesRepository {
  getStates(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<StateResponse>>>;
  getCities(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<CityResponse>>>;
  getNotaryOffices(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotaryOfficeResponse>>>;
  getNotaryOfficeById(id: number): Promise<QrResponse<NotaryOfficeResponse>>;
  createNotaryOffice(request: NotaryOfficeRequest): Promise<QrResponse<null>>;
  updateNotaryOffice(id: number, request: NotaryOfficeUpdateRequest): Promise<QrResponse<NotaryOfficeResponse>>;
}
