import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createGetTaskTypesUseCase,
  createGetFormByTaskTypeIdUseCase,
  createGetTaskConfigActionsUseCase,
  createPostTaskConfigUseCase,
  createGetTaskConfigByIdUseCase,
  createGetTaskConfigsUseCase,
  createGetActionsUseCase,
} from '../usecases/task-config.usecases';

export function useTaskConfig() {
  const { apiService } = useAuth();

  const getTaskTypes = useCallback(
    async (params?: Record<string, string | string[]>) => {
      if (!apiService) return null;
      return createGetTaskTypesUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getFormByTaskTypeId = useCallback(
    async (taskTypeId: number) => {
      if (!apiService) return null;
      return createGetFormByTaskTypeIdUseCase(apiService).execute(taskTypeId);
    },
    [apiService]
  );

  const getTaskConfigActions = useCallback(
    async (taskConfigId: number) => {
      if (!apiService) return null;
      return createGetTaskConfigActionsUseCase(apiService).execute(taskConfigId);
    },
    [apiService]
  );

  const postTaskConfig = useCallback(
    async (body: {
      taskTypeId: number;
      actions: { name: string; dependencies: string[] }[];
      form: { formFields: { id?: number; name?: string; type?: string; component?: string; field?: Record<string, unknown> }[] };
      statusConfig: unknown;
      fileConfig?: unknown;
    }) => {
      if (!apiService) return null;
      return createPostTaskConfigUseCase(apiService).execute(body);
    },
    [apiService]
  );

  const getTaskConfigById = useCallback(
    async (taskConfigId: number) => {
      if (!apiService) return null;
      return createGetTaskConfigByIdUseCase(apiService).execute(taskConfigId);
    },
    [apiService]
  );

  const getTaskConfigs = useCallback(
    async (params?: Record<string, string | string[]>) => {
      if (!apiService) return null;
      return createGetTaskConfigsUseCase(apiService).execute(params);
    },
    [apiService]
  );

  const getActions = useCallback(async () => {
    if (!apiService) return null;
    return createGetActionsUseCase(apiService).execute();
  }, [apiService]);

  return {
    getTaskTypes,
    getFormByTaskTypeId,
    getTaskConfigActions,
    postTaskConfig,
    getTaskConfigById,
    getTaskConfigs,
    getActions,
    hasApi: !!apiService,
  };
}
