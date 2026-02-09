import type { TaskConfigRepository } from '../repositories/task-config.repository';

export function createGetTaskTypesUseCase(repo: TaskConfigRepository) {
  return {
    async execute(params?: Record<string, string | string[]>) {
      return repo.getTaskTypes(params);
    },
  };
}

export function createGetFormByTaskTypeIdUseCase(repo: TaskConfigRepository) {
  return {
    async execute(taskTypeId: number) {
      return repo.getFormByTaskTypeId(taskTypeId);
    },
  };
}

export function createGetTaskConfigActionsUseCase(repo: TaskConfigRepository) {
  return {
    async execute(taskConfigId: number) {
      return repo.getTaskConfigActions(taskConfigId);
    },
  };
}

export function createPostTaskConfigUseCase(repo: TaskConfigRepository) {
  return {
    async execute(body: Parameters<TaskConfigRepository['postTaskConfig']>[0]) {
      return repo.postTaskConfig(body);
    },
  };
}

export function createGetTaskConfigByIdUseCase(repo: TaskConfigRepository) {
  return {
    async execute(taskConfigId: number) {
      return repo.getTaskConfigById(taskConfigId);
    },
  };
}

export function createGetTaskConfigsUseCase(repo: TaskConfigRepository) {
  return {
    async execute(params?: Record<string, string | string[]>) {
      return repo.getTaskConfigs(params);
    },
  };
}

export function createGetActionsUseCase(repo: TaskConfigRepository) {
  return {
    async execute() {
      return repo.getActions();
    },
  };
}
