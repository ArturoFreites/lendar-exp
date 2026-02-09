import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetRegionsUseCase,
  createGetRegionByIdUseCase,
  createGetRegionCoverageUseCase,
  createUpdateRegionCoverageUseCase,
  createCreateRegionUseCase,
  createUpdateRegionUseCase,
} from '../usecases/regions.usecases';
import type { RegionRequest, RegionUpdateRequest, CoverageAreaRequest } from '../types/dto';

export function useRegions() {
  const { apiService } = useAuth();

  const getRegions = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetRegionsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getRegionById = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createGetRegionByIdUseCase(apiService).execute(id);
    },
    [apiService]
  );

  const getRegionCoverage = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createGetRegionCoverageUseCase(apiService).execute(id);
    },
    [apiService]
  );

  const updateRegionCoverage = useCallback(
    async (id: number, areas: CoverageAreaRequest[]) => {
      if (!apiService) return null;
      return createUpdateRegionCoverageUseCase(apiService).execute(id, areas);
    },
    [apiService]
  );

  const createRegion = useCallback(
    async (request: RegionRequest) => {
      if (!apiService) return null;
      return createCreateRegionUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateRegion = useCallback(
    async (id: number, request: RegionUpdateRequest) => {
      if (!apiService) return null;
      return createUpdateRegionUseCase(apiService).execute(id, request);
    },
    [apiService]
  );

  return {
    getRegions,
    getRegionById,
    getRegionCoverage,
    updateRegionCoverage,
    createRegion,
    updateRegion,
    hasApi: !!apiService,
  };
}
