import type { QrResponse, PaginationResponse, MigratedPersonResponse } from '../types/dto';

export interface MigratedPersonRepository {
  getMigratedPersons(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<MigratedPersonResponse>>>;
  importMigratedPersonsCsv(file: File): Promise<QrResponse<number>>;
}
