import type { NotificationsRepository } from '../repositories/notifications.repository';

export function createGetNotificationsUseCase(repo: NotificationsRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getNotifications(params);
    },
  };
}

export function createGetNotificationConfigsUseCase(repo: NotificationsRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getNotificationConfigs(params);
    },
  };
}

export function createMarkNotificationReadUseCase(repo: NotificationsRepository) {
  return {
    async execute(id: number) {
      return repo.markNotificationAsRead(id);
    },
  };
}

export function createCreateNotificationConfigUseCase(repo: NotificationsRepository) {
  return {
    async execute(request: Parameters<NotificationsRepository['createNotificationConfig']>[0]) {
      return repo.createNotificationConfig(request);
    },
  };
}

export function createUpdateNotificationConfigUseCase(repo: NotificationsRepository) {
  return {
    async execute(id: number, request: Parameters<NotificationsRepository['updateNotificationConfig']>[1]) {
      return repo.updateNotificationConfig(id, request);
    },
  };
}

export function createUpdateNotificationConfigActiveUseCase(repo: NotificationsRepository) {
  return {
    async execute(id: number, active: boolean) {
      return repo.updateNotificationConfigActive(id, active);
    },
  };
}
