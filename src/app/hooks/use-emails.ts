import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetEmailConfigsUseCase,
  createGetEmailLayoutConfigUseCase,
  createGetEmailLayoutConfigDefaultUseCase,
  createCreateEmailConfigUseCase,
  createUpdateEmailConfigUseCase,
  createUpdateEmailConfigActiveUseCase,
  createSendEmailConfigTestUseCase,
  createUpdateEmailLayoutConfigUseCase,
} from '../usecases/emails.usecases';

export function useEmails() {
  const { apiService } = useAuth();

  const getEmailConfigs = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetEmailConfigsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getEmailLayoutConfig = useCallback(async () => {
    if (!apiService) return null;
    return createGetEmailLayoutConfigUseCase(apiService).execute();
  }, [apiService]);

  const getEmailLayoutConfigDefault = useCallback(async () => {
    if (!apiService) return null;
    return createGetEmailLayoutConfigDefaultUseCase(apiService).execute();
  }, [apiService]);

  const createEmailConfig = useCallback(
    async (request: { key: string; description?: string | null; subjectTemplate: string; bodyTemplate: string }) => {
      if (!apiService) return null;
      return createCreateEmailConfigUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateEmailConfig = useCallback(
    async (id: number, request: { key: string; description?: string | null; subjectTemplate: string; bodyTemplate: string }) => {
      if (!apiService) return null;
      return createUpdateEmailConfigUseCase(apiService).execute(id, request);
    },
    [apiService]
  );

  const updateEmailConfigActive = useCallback(
    async (id: number, active: boolean) => {
      if (!apiService) return null;
      return createUpdateEmailConfigActiveUseCase(apiService).execute(id, active);
    },
    [apiService]
  );

  const sendEmailConfigTest = useCallback(
    async (id: number, to: string) => {
      if (!apiService) return null;
      return createSendEmailConfigTestUseCase(apiService).execute(id, to);
    },
    [apiService]
  );

  const updateEmailLayoutConfig = useCallback(
    async (request: { headerHtml: string; footerHtml: string }) => {
      if (!apiService) return null;
      return createUpdateEmailLayoutConfigUseCase(apiService).execute(request);
    },
    [apiService]
  );

  return {
    getEmailConfigs,
    getEmailLayoutConfig,
    getEmailLayoutConfigDefault,
    createEmailConfig,
    updateEmailConfig,
    updateEmailConfigActive,
    sendEmailConfigTest,
    updateEmailLayoutConfig,
    hasApi: !!apiService,
  };
}
