import type { ApplicationConfigRepository } from '../repositories/application-config.repository';
import type { ApplicationConfigRequest } from '../types/dto';

export function createGetApplicationConfigLastUseCase(repo: ApplicationConfigRepository) {
  return {
    async execute() {
      return repo.getApplicationConfigLast();
    },
  };
}

export function createGetApplicationConfigListUseCase(repo: ApplicationConfigRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getApplicationConfigList(params);
    },
  };
}

export function createApplicationConfigUseCase(repo: ApplicationConfigRepository) {
  return {
    async execute(request: ApplicationConfigRequest) {
      return repo.createApplicationConfig(request);
    },
  };
}
