import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetNotaryOfficesUseCase,
  createGetStatesUseCase,
  createGetCitiesUseCase,
  createGetNotaryOfficeByIdUseCase,
  createCreateNotaryOfficeUseCase,
  createUpdateNotaryOfficeUseCase,
} from '../usecases/notary-offices.usecases';

export function useNotaryOffices() {
  const { apiService } = useAuth();

  const getNotaryOffices = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetNotaryOfficesUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getStates = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetStatesUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getCities = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetCitiesUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getNotaryOfficeById = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createGetNotaryOfficeByIdUseCase(apiService).execute(id);
    },
    [apiService]
  );

  const createNotaryOffice = useCallback(
    async (request: { name: string; address: { cityId: number | null; stateId: number; street?: string | null; streetNumber?: string | null; neighborhood?: string | null; floor?: string | null; department?: string | null; postalCode?: string | null } }) => {
      if (!apiService) return null;
      return createCreateNotaryOfficeUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateNotaryOffice = useCallback(
    async (id: number, request: { name?: string; address?: { cityId: number | null; stateId: number; street?: string | null; streetNumber?: string | null; neighborhood?: string | null; floor?: string | null; department?: string | null; postalCode?: string | null } }) => {
      if (!apiService) return null;
      return createUpdateNotaryOfficeUseCase(apiService).execute(id, request);
    },
    [apiService]
  );

  return {
    getNotaryOffices,
    getStates,
    getCities,
    getNotaryOfficeById,
    createNotaryOffice,
    updateNotaryOffice,
    hasApi: !!apiService,
  };
}
