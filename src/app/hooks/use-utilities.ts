import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createStartNormalizeAddressesUseCase,
  createGetNormalizeAddressesJobStatusUseCase,
} from '../usecases/utilities.usecases';

export function useUtilities() {
  const { apiService } = useAuth();

  const startNormalizeAddresses = useCallback(async () => {
    if (!apiService) return null;
    return createStartNormalizeAddressesUseCase(apiService).execute();
  }, [apiService]);

  const getNormalizeAddressesJobStatus = useCallback(
    async (jobId: string) => {
      if (!apiService) return null;
      return createGetNormalizeAddressesJobStatusUseCase(apiService).execute(jobId);
    },
    [apiService]
  );

  return {
    startNormalizeAddresses,
    getNormalizeAddressesJobStatus,
    hasApi: !!apiService,
  };
}
