import type { MigratedPersonRepository } from '../repositories/migrated-person.repository';

export function createGetMigratedPersonsUseCase(repo: MigratedPersonRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getMigratedPersons(params);
    },
  };
}
