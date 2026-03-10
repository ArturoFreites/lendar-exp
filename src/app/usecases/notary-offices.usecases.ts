import type { NotaryOfficesRepository } from '../repositories/notary-offices.repository';

export function createGetNotaryOfficesUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getNotaryOffices(params);
    },
  };
}

export function createGetStatesUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getStates(params);
    },
  };
}

export function createGetCitiesUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getCities(params);
    },
  };
}

export function createGetNotaryOfficeByIdUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(id: number) {
      return repo.getNotaryOfficeById(id);
    },
  };
}

export function createCreateNotaryOfficeUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(request: Parameters<NotaryOfficesRepository['createNotaryOffice']>[0]) {
      return repo.createNotaryOffice(request);
    },
  };
}

export function createUpdateNotaryOfficeUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(id: number, request: Parameters<NotaryOfficesRepository['updateNotaryOffice']>[1]) {
      return repo.updateNotaryOffice(id, request);
    },
  };
}

export function createGetNotaryOfficeUsersUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(officeId: number) {
      return repo.getNotaryOfficeUsers(officeId);
    },
  };
}

export function createSearchNotaryOfficeUsersUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.searchNotaryOfficeUsers(params);
    },
  };
}

export function createAssignNotaryOfficeUserUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(officeId: number, userId: number) {
      return repo.assignNotaryOfficeUser(officeId, userId);
    },
  };
}

export function createCreateNotaryOfficeUserUseCase(repo: NotaryOfficesRepository) {
  return {
    async execute(officeId: number, request: Parameters<NotaryOfficesRepository['createNotaryOfficeUser']>[1]) {
      return repo.createNotaryOfficeUser(officeId, request);
    },
  };
}
