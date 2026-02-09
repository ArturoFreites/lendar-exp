import type {
  QrResponse,
  PaginationResponse,
  RegionResponse,
  RegionRequest,
  RegionUpdateRequest,
  CoverageAreaResponse,
  CoverageAreaRequest,
} from '../types/dto';

export interface RegionsRepository {
  getRegions(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<RegionResponse>>>;
  getRegionById(id: number): Promise<QrResponse<RegionResponse>>;
  getRegionCoverage(id: number): Promise<QrResponse<CoverageAreaResponse[]>>;
  updateRegionCoverage(id: number, areas: CoverageAreaRequest[]): Promise<QrResponse<CoverageAreaResponse[]>>;
  createRegion(request: RegionRequest): Promise<QrResponse<RegionResponse>>;
  updateRegion(id: number, request: RegionUpdateRequest): Promise<QrResponse<RegionResponse>>;
}
