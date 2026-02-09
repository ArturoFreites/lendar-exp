import type {
  QrResponse,
  PaginationResponse,
  ActionResponse,
  TaskConfigActionsResponse,
  FormResponse,
  TaskConfigSaveRequest,
  TaskConfigListItem,
} from '../types/dto';

export interface TaskConfigRepository {
  getActions(): Promise<QrResponse<ActionResponse[]>>;
  getTaskConfigs(params?: Record<string, string | string[]>): Promise<QrResponse<PaginationResponse<TaskConfigListItem>>>;
  getTaskConfigById(taskConfigId: number): Promise<QrResponse<FormResponse>>;
  getFormByTaskTypeId(taskTypeId: number): Promise<QrResponse<FormResponse>>;
  getTaskConfigActions(taskConfigId: number): Promise<QrResponse<TaskConfigActionsResponse>>;
  postTaskConfig(body: TaskConfigSaveRequest): Promise<QrResponse<unknown>>;
  getTaskTypes(params?: Record<string, string | string[]>): Promise<QrResponse<PaginationResponse<Record<string, unknown>>>>;
}
