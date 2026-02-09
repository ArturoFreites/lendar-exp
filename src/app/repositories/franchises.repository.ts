import type {
  QrResponse,
  PaginationResponse,
  FranchiseResponse,
  FranchiseRequest,
  FranchiseUpdateRequest,
  CoverageAreaResponse,
  CoverageAreaRequest,
} from '../types/dto';

export interface FranchisesRepository {
  getFranchises(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<FranchiseResponse>>>;
  getFranchiseById(id: number): Promise<QrResponse<FranchiseResponse>>;
  getFranchiseCoverage(id: number): Promise<QrResponse<CoverageAreaResponse[]>>;
  updateFranchiseCoverage(id: number, areas: CoverageAreaRequest[]): Promise<QrResponse<CoverageAreaResponse[]>>;
  createFranchise(request: FranchiseRequest): Promise<QrResponse<FranchiseResponse>>;
  updateFranchise(id: number, request: FranchiseUpdateRequest): Promise<QrResponse<FranchiseResponse>>;
}
