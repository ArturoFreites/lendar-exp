import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createGetMigratedPersonsUseCase, createImportMigratedPersonsCsvUseCase } from '../usecases/migrated-person.usecases';

export function useMigratedPerson() {
  const { apiService } = useAuth();

  const getMigratedPersons = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetMigratedPersonsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const importMigratedPersonsCsv = useCallback(
    async (file: File) => {
      if (!apiService) return null;
      return createImportMigratedPersonsCsvUseCase(apiService).execute(file);
    },
    [apiService]
  );

  return {
    getMigratedPersons,
    importMigratedPersonsCsv,
    hasApi: !!apiService,
  };
}
