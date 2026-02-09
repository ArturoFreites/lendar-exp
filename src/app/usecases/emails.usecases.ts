import type { EmailConfigRepository } from '../repositories/email-config.repository';

export function createGetEmailConfigsUseCase(repo: EmailConfigRepository) {
  return {
    async execute(params?: Record<string, string>) {
      return repo.getEmailConfigs(params);
    },
  };
}

export function createGetEmailLayoutConfigUseCase(repo: EmailConfigRepository) {
  return {
    async execute() {
      return repo.getEmailLayoutConfig();
    },
  };
}

export function createGetEmailLayoutConfigDefaultUseCase(repo: EmailConfigRepository) {
  return {
    async execute() {
      return repo.getEmailLayoutConfigDefault();
    },
  };
}

export function createCreateEmailConfigUseCase(repo: EmailConfigRepository) {
  return {
    async execute(request: Parameters<EmailConfigRepository['createEmailConfig']>[0]) {
      return repo.createEmailConfig(request);
    },
  };
}

export function createUpdateEmailConfigUseCase(repo: EmailConfigRepository) {
  return {
    async execute(id: number, request: Parameters<EmailConfigRepository['updateEmailConfig']>[1]) {
      return repo.updateEmailConfig(id, request);
    },
  };
}

export function createUpdateEmailConfigActiveUseCase(repo: EmailConfigRepository) {
  return {
    async execute(id: number, active: boolean) {
      return repo.updateEmailConfigActive(id, active);
    },
  };
}

export function createSendEmailConfigTestUseCase(repo: EmailConfigRepository) {
  return {
    async execute(id: number, to: string) {
      return repo.sendEmailConfigTest(id, to);
    },
  };
}

export function createUpdateEmailLayoutConfigUseCase(repo: EmailConfigRepository) {
  return {
    async execute(request: Parameters<EmailConfigRepository['updateEmailLayoutConfig']>[0]) {
      return repo.updateEmailLayoutConfig(request);
    },
  };
}
