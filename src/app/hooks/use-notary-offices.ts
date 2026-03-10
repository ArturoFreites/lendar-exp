import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetNotaryOfficesUseCase,
  createGetStatesUseCase,
  createGetCitiesUseCase,
  createGetNotaryOfficeByIdUseCase,
  createCreateNotaryOfficeUseCase,
  createUpdateNotaryOfficeUseCase,
  createGetNotaryOfficeUsersUseCase,
  createSearchNotaryOfficeUsersUseCase,
  createAssignNotaryOfficeUserUseCase,
  createCreateNotaryOfficeUserUseCase,
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

  const getNotaryOfficeUsers = useCallback(
    async (officeId: number) => {
      if (!apiService) return null;
      return createGetNotaryOfficeUsersUseCase(apiService).execute(officeId);
    },
    [apiService]
  );

  const searchNotaryOfficeUsers = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createSearchNotaryOfficeUsersUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const assignNotaryOfficeUser = useCallback(
    async (officeId: number, userId: number) => {
      if (!apiService) return null;
      return createAssignNotaryOfficeUserUseCase(apiService).execute(officeId, userId);
    },
    [apiService]
  );

  const createNotaryOfficeUser = useCallback(
    async (officeId: number, request: { name: string; lastName: string; email: string; password: string }) => {
      if (!apiService) return null;
      return createCreateNotaryOfficeUserUseCase(apiService).execute(officeId, request);
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
    getNotaryOfficeUsers,
    searchNotaryOfficeUsers,
    assignNotaryOfficeUser,
    createNotaryOfficeUser,
    hasApi: !!apiService,
  };
}
