import type { UtilitiesRepository } from '../repositories/utilities.repository';
import type { NormalizeAddressesJobStatusResponse } from '../types/dto';

export function createStartNormalizeAddressesUseCase(repo: UtilitiesRepository) {
  return {
    async execute() {
      return repo.startNormalizeAddresses();
    },
  };
}

export function createGetNormalizeAddressesJobStatusUseCase(repo: UtilitiesRepository) {
  return {
    async execute(jobId: string): Promise<{ data: NormalizeAddressesJobStatusResponse | null; code: number; message: string }> {
      const response = await repo.getNormalizeAddressesJobStatus(jobId);
      return {
        data: response.data ?? null,
        code: response.code,
        message: response.message,
      };
    },
  };
}
