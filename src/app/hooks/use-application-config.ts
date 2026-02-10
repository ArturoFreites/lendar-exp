import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetApplicationConfigLastUseCase,
  createGetApplicationConfigListUseCase,
  createApplicationConfigUseCase,
} from '../usecases/application-config.usecases';
import type { ApplicationConfigRequest } from '../types/dto';

export function useApplicationConfig() {
  const { apiService } = useAuth();

  const getApplicationConfigLast = useCallback(async () => {
    if (!apiService) return null;
    return createGetApplicationConfigLastUseCase(apiService).execute();
  }, [apiService]);

  const getApplicationConfigList = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetApplicationConfigListUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const createApplicationConfig = useCallback(
    async (request: ApplicationConfigRequest) => {
      if (!apiService) return null;
      return createApplicationConfigUseCase(apiService).execute(request);
    },
    [apiService]
  );

  return {
    getApplicationConfigLast,
    getApplicationConfigList,
    createApplicationConfig,
    hasApi: !!apiService,
  };
}
