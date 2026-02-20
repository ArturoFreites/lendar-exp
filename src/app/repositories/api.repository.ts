import type { AuthRepository } from './auth.repository';
import type { NotificationsRepository } from './notifications.repository';
import type { EmailConfigRepository } from './email-config.repository';
import type { UsersRepository } from './users.repository';
import type { ApplicationsRepository } from './applications.repository';
import type { NotaryOfficesRepository } from './notary-offices.repository';
import type { TaskConfigRepository } from './task-config.repository';
import type { RegionsRepository } from './regions.repository';
import type { FranchisesRepository } from './franchises.repository';
import type { UtilitiesRepository } from './utilities.repository';
import type { ApplicationConfigRepository } from './application-config.repository';
import type { MigratedPersonRepository } from './migrated-person.repository';

export type ApiRepository = AuthRepository &
  NotificationsRepository &
  EmailConfigRepository &
  UsersRepository &
  MigratedPersonRepository &
  ApplicationsRepository &
  NotaryOfficesRepository &
  TaskConfigRepository &
  RegionsRepository &
  FranchisesRepository &
  UtilitiesRepository &
  ApplicationConfigRepository;

export type {
  AuthRepository,
  NotificationsRepository,
  EmailConfigRepository,
  UsersRepository,
  MigratedPersonRepository,
  ApplicationsRepository,
  NotaryOfficesRepository,
  TaskConfigRepository,
  RegionsRepository,
  FranchisesRepository,
  UtilitiesRepository,
  ApplicationConfigRepository,
};
