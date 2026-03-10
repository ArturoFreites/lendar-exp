import type {
  QrResponse,
  PaginationResponse,
  StateResponse,
  CityResponse,
  NotaryOfficeResponse,
  NotaryOfficeRequest,
  NotaryOfficeUpdateRequest,
  UserResponse,
  NotaryOfficeUserCreateRequest,
} from '../types/dto';

export interface NotaryOfficesRepository {
  getStates(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<StateResponse>>>;
  getCities(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<CityResponse>>>;
  getNotaryOffices(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotaryOfficeResponse>>>;
  getNotaryOfficeById(id: number): Promise<QrResponse<NotaryOfficeResponse>>;
  createNotaryOffice(request: NotaryOfficeRequest): Promise<QrResponse<null>>;
  updateNotaryOffice(id: number, request: NotaryOfficeUpdateRequest): Promise<QrResponse<NotaryOfficeResponse>>;
  getNotaryOfficeUsers(officeId: number): Promise<QrResponse<UserResponse[]>>;
  searchNotaryOfficeUsers(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<UserResponse>>>;
  assignNotaryOfficeUser(officeId: number, userId: number): Promise<QrResponse<null>>;
  createNotaryOfficeUser(officeId: number, request: NotaryOfficeUserCreateRequest): Promise<QrResponse<UserResponse>>;
}
