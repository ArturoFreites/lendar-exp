import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createGetMigratedPersonsUseCase } from '../usecases/migrated-person.usecases';

export function useMigratedPerson() {
  const { apiService } = useAuth();

  const getMigratedPersons = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetMigratedPersonsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  return {
    getMigratedPersons,
    hasApi: !!apiService,
  };
}
