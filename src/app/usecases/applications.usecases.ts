import type { ApplicationsRepository } from '../repositories/applications.repository';

export function createGetApplicationsReceivedUseCase(repo: ApplicationsRepository) {
  return {
    async execute(params?: Record<string, string | string[]>) {
      return repo.getApplicationsReceived(params);
    },
  };
}

export function createGetApplicationReceivedByIdUseCase(repo: ApplicationsRepository) {
  return {
    async execute(id: number) {
      return repo.getApplicationReceivedById(id);
    },
  };
}
