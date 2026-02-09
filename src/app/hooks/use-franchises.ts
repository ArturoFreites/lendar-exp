import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetFranchisesUseCase,
  createGetFranchiseByIdUseCase,
  createGetFranchiseCoverageUseCase,
  createUpdateFranchiseCoverageUseCase,
  createCreateFranchiseUseCase,
  createUpdateFranchiseUseCase,
} from '../usecases/franchises.usecases';
import type { FranchiseRequest, FranchiseUpdateRequest, CoverageAreaRequest } from '../types/dto';

export function useFranchises() {
  const { apiService } = useAuth();

  const getFranchises = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetFranchisesUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getFranchiseById = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createGetFranchiseByIdUseCase(apiService).execute(id);
    },
    [apiService]
  );

  const getFranchiseCoverage = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createGetFranchiseCoverageUseCase(apiService).execute(id);
    },
    [apiService]
  );

  const updateFranchiseCoverage = useCallback(
    async (id: number, areas: CoverageAreaRequest[]) => {
      if (!apiService) return null;
      return createUpdateFranchiseCoverageUseCase(apiService).execute(id, areas);
    },
    [apiService]
  );

  const createFranchise = useCallback(
    async (request: FranchiseRequest) => {
      if (!apiService) return null;
      return createCreateFranchiseUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateFranchise = useCallback(
    async (id: number, request: FranchiseUpdateRequest) => {
      if (!apiService) return null;
      return createUpdateFranchiseUseCase(apiService).execute(id, request);
    },
    [apiService]
  );

  return {
    getFranchises,
    getFranchiseById,
    getFranchiseCoverage,
    updateFranchiseCoverage,
    createFranchise,
    updateFranchise,
    hasApi: !!apiService,
  };
}
