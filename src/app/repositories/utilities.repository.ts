import type {
  QrResponse,
  NormalizeAddressesJobStartResponse,
  NormalizeAddressesJobStatusResponse,
} from '../types/dto';

export interface UtilitiesRepository {
  startNormalizeAddresses(): Promise<QrResponse<NormalizeAddressesJobStartResponse>>;
  getNormalizeAddressesJobStatus(jobId: string): Promise<QrResponse<NormalizeAddressesJobStatusResponse>>;
}
