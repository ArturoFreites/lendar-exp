import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetApplicationsReceivedUseCase,
  createGetApplicationReceivedByIdUseCase,
} from '../usecases/applications.usecases';

export function useApplicationsReceived() {
  const { apiService } = useAuth();

  const getApplicationsReceived = useCallback(
    async (params?: Record<string, string | string[]>) => {
      if (!apiService) return null;
      return createGetApplicationsReceivedUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getApplicationReceivedById = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createGetApplicationReceivedByIdUseCase(apiService).execute(id);
    },
    [apiService]
  );

  return {
    getApplicationsReceived,
    getApplicationReceivedById,
    hasApi: !!apiService,
  };
}
