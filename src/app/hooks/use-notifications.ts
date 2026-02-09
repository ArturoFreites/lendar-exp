import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetNotificationsUseCase,
  createGetNotificationConfigsUseCase,
  createMarkNotificationReadUseCase,
  createCreateNotificationConfigUseCase,
  createUpdateNotificationConfigUseCase,
  createUpdateNotificationConfigActiveUseCase,
} from '../usecases/notifications.usecases';

export function useNotificationUseCases() {
  const { apiService } = useAuth();

  const getNotifications = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetNotificationsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getNotificationConfigs = useCallback(
    async (params?: Record<string, string>) => {
      if (!apiService) return null;
      return createGetNotificationConfigsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const markNotificationAsRead = useCallback(
    async (id: number) => {
      if (!apiService) return null;
      return createMarkNotificationReadUseCase(apiService).execute(id);
    },
    [apiService]
  );

  const createNotificationConfig = useCallback(
    async (request: { key: string; titleTemplate: string; messageTemplate: string; deepLinkTemplate?: string | null; metadataTemplate?: unknown }) => {
      if (!apiService) return null;
      return createCreateNotificationConfigUseCase(apiService).execute(request);
    },
    [apiService]
  );

  const updateNotificationConfig = useCallback(
    async (id: number, request: { key: string; titleTemplate: string; messageTemplate: string; deepLinkTemplate?: string | null; metadataTemplate?: unknown }) => {
      if (!apiService) return null;
      return createUpdateNotificationConfigUseCase(apiService).execute(id, request);
    },
    [apiService]
  );

  const updateNotificationConfigActive = useCallback(
    async (id: number, active: boolean) => {
      if (!apiService) return null;
      return createUpdateNotificationConfigActiveUseCase(apiService).execute(id, active);
    },
    [apiService]
  );

  return {
    getNotifications,
    getNotificationConfigs,
    markNotificationAsRead,
    createNotificationConfig,
    updateNotificationConfig,
    updateNotificationConfigActive,
    hasApi: !!apiService,
  };
}
