import type { RegionsRepository } from '../repositories/regions.repository';
import type { RegionRequest, RegionUpdateRequest, CoverageAreaRequest } from '../types/dto';

export function createGetRegionsUseCase(repo: RegionsRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getRegions(params);
    },
  };
}

export function createGetRegionByIdUseCase(repo: RegionsRepository) {
  return {
    async execute(id: number) {
      return repo.getRegionById(id);
    },
  };
}

export function createGetRegionCoverageUseCase(repo: RegionsRepository) {
  return {
    async execute(id: number) {
      return repo.getRegionCoverage(id);
    },
  };
}

export function createUpdateRegionCoverageUseCase(repo: RegionsRepository) {
  return {
    async execute(id: number, areas: CoverageAreaRequest[]) {
      return repo.updateRegionCoverage(id, areas);
    },
  };
}

export function createCreateRegionUseCase(repo: RegionsRepository) {
  return {
    async execute(request: RegionRequest) {
      return repo.createRegion(request);
    },
  };
}

export function createUpdateRegionUseCase(repo: RegionsRepository) {
  return {
    async execute(id: number, request: RegionUpdateRequest) {
      return repo.updateRegion(id, request);
    },
  };
}
