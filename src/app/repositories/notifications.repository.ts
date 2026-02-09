import type {
  QrResponse,
  PaginationResponse,
  NotificationResponse,
  NotificationConfigRequest,
  NotificationConfigResponse,
} from '../types/dto';

export interface NotificationsRepository {
  getNotifications(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotificationResponse>>>;
  markNotificationAsRead(id: number): Promise<QrResponse<NotificationResponse>>;
  getNotificationConfigs(params?: Record<string, string>): Promise<QrResponse<PaginationResponse<NotificationConfigResponse>>>;
  getNotificationConfigById(id: number): Promise<QrResponse<NotificationConfigResponse>>;
  getNotificationConfigByKey(key: string): Promise<QrResponse<NotificationConfigResponse>>;
  createNotificationConfig(request: NotificationConfigRequest): Promise<QrResponse<null>>;
  updateNotificationConfig(id: number, request: NotificationConfigRequest): Promise<QrResponse<NotificationConfigResponse>>;
  updateNotificationConfigActive(id: number, active: boolean): Promise<QrResponse<NotificationConfigResponse>>;
}
