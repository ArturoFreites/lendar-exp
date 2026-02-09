import type { FranchisesRepository } from '../repositories/franchises.repository';
import type { FranchiseRequest, FranchiseUpdateRequest, CoverageAreaRequest } from '../types/dto';

export function createGetFranchisesUseCase(repo: FranchisesRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getFranchises(params);
    },
  };
}

export function createGetFranchiseByIdUseCase(repo: FranchisesRepository) {
  return {
    async execute(id: number) {
      return repo.getFranchiseById(id);
    },
  };
}

export function createGetFranchiseCoverageUseCase(repo: FranchisesRepository) {
  return {
    async execute(id: number) {
      return repo.getFranchiseCoverage(id);
    },
  };
}

export function createUpdateFranchiseCoverageUseCase(repo: FranchisesRepository) {
  return {
    async execute(id: number, areas: CoverageAreaRequest[]) {
      return repo.updateFranchiseCoverage(id, areas);
    },
  };
}

export function createCreateFranchiseUseCase(repo: FranchisesRepository) {
  return {
    async execute(request: FranchiseRequest) {
      return repo.createFranchise(request);
    },
  };
}

export function createUpdateFranchiseUseCase(repo: FranchisesRepository) {
  return {
    async execute(id: number, request: FranchiseUpdateRequest) {
      return repo.updateFranchise(id, request);
    },
  };
}
