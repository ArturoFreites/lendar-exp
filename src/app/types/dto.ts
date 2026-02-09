export interface QrResponse<T> {
  data: T | null;
  code: number;
  message: string;
  errors: string[] | null;
}

export interface AuthRequest {
  email: string;
  password: string;
  fcmToken?: string;
  platform?: string;
}

export interface TokenBundleResponse {
  tokenType: string;
  accessToken: string;
  accessJti: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshJti: string;
  familyId: string;
  expiresInSeconds: number;
}

export interface AuthResponse {
  id: number;
  name: string;
  lastName: string;
  email: string;
  tokens: TokenBundleResponse;
  roles: string[];
  confirmEmail: boolean;
}

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  status: string;
  deepLink: string | null;
  metadata: unknown;
  createdAt: string;
  readAt: string | null;
  sentPushAt: string | null;
  sentEmailAt: string | null;
}

export interface BackendPaginationResponse<T> {
  results: T[];
  page: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface NotificationConfigRequest {
  key: string;
  titleTemplate: string;
  messageTemplate: string;
  deepLinkTemplate?: string | null;
  metadataTemplate?: unknown;
}

export interface NotificationConfigResponse {
  id: number;
  key: string;
  titleTemplate: string;
  messageTemplate: string;
  deepLinkTemplate: string | null;
  metadataTemplate: unknown;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailConfigRequest {
  key: string;
  description?: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface EmailConfigResponse {
  id: number;
  key: string;
  description: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLayoutConfigRequest {
  headerHtml: string;
  footerHtml: string;
}

export interface EmailLayoutConfigResponse {
  id: number | null;
  headerHtml: string;
  footerHtml: string;
  updatedAt: string | null;
}

export interface UserProfileResponse {
  userId: number;
  email: string;
  name: string;
  lastName: string;
  createdAt: string;
  confirmEmail: boolean;
  enable: boolean;
  roles: string[];
  client: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    createdAt: string;
  } | null;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  lastName: string;
  createdAt: string;
  roles: RoleResponse[];
}

export interface RoleResponse {
  id: number;
  name: string;
  permissions?: PermissionResponse[];
}

export interface PermissionResponse {
  id: number;
  name: string;
  description?: string;
}

export interface RoleRequest {
  name: string;
  permissionIds: number[];
}

export interface UserRoleUpdaterRequest {
  type: string;
  userId: number;
}

export interface PermissionRequest {
  name: string;
  description?: string;
}

export interface UserUpdateRequest {
  userId: number;
  name: string;
  lastName: string;
  email?: string;
  birthday?: string;
  phone?: string;
  nationality?: string;
  gender?: string;
  cuit?: string;
  socialReason?: string;
}

export interface UserFcmTokenRequest {
  fcmToken: string;
  platform: string;
  deviceLabel: string;
}

export interface TaskTypeRoleRequest {
  type: string;
  roleIds: number[];
  taskTypeId: number;
}

export interface ActionResponse {
  id: number;
  name: string;
}

export interface ActionItemWithDependenciesResponse {
  actionItemId: number;
  actionId: number | null;
  actionName: string | null;
  dependencyActionItemIds: number[];
}

export interface TaskConfigActionsResponse {
  taskConfigId: number;
  actions: ActionItemWithDependenciesResponse[];
}

export interface FormFieldResponse {
  id?: number;
  name?: string;
  type?: string;
  component?: string;
  field?: Record<string, unknown>;
}

export interface FormResponse {
  formFields: FormFieldResponse[];
  taskConfigId: number;
  taskName: string;
  statusConfig: unknown;
  fileConfig: unknown;
  extraData: unknown;
  messages: unknown;
}

export interface TaskConfigActionSave {
  name: string;
  dependencies: string[];
}

export interface TaskConfigSaveRequest {
  taskTypeId: number;
  actions: TaskConfigActionSave[];
  form: { formFields: FormFieldResponse[] };
  statusConfig: unknown;
  fileConfig?: unknown;
}

export type TaskConfigListItem = Record<string, unknown>;

export interface ApplicationResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  quotaValue: number | null;
  amount: number | null;
  percentageAmount: number | null;
  term: string | null;
  propertyValue: number | null;
  reserved: boolean | null;
  officeRemaxName: string | null;
  operationType: string | null;
  remaxContact: boolean | null;
  propertyRemax: boolean | null;
  spouse: string | null;
  taskTypeName: string | null;
  stage: string | null;
  status: string | null;
  subStatus: string | null;
  reason: string | null;
  contractUrl: string | null;
  applicationConfigId: number | null;
  region: Record<string, unknown> | null;
  notaryOffice: Record<string, unknown> | null;
  clients: ApplicationClientResponse[] | null;
  cbu: string | null;
  bcraBackground: boolean | null;
  politicallyExposed: boolean | null;
  civilStatus: string | null;
  residenceAddress: Record<string, unknown> | null;
}

export interface ApplicationClientResponse {
  client: Record<string, unknown>;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApplicationFindResponse extends ApplicationResponse {
  fee?: number;
}

export interface StateResponse {
  id: number;
  name: string;
}

export interface CityResponse {
  id: number;
  name: string;
  stateId: number;
}

export interface AddressResponse {
  city: CityResponse | null;
  state: StateResponse | null;
  street: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  floor: string | null;
  department: string | null;
  postalCode: string | null;
}

export interface NotaryOfficeResponse {
  id: number;
  name: string;
  address: AddressResponse | null;
  createdAt: string;
}

export interface AddressRequest {
  cityId: number | null;
  stateId: number;
  street?: string | null;
  streetNumber?: string | null;
  neighborhood?: string | null;
  floor?: string | null;
  department?: string | null;
  postalCode?: string | null;
}

export interface NotaryOfficeRequest {
  name: string;
  address: AddressRequest;
}

export interface NotaryOfficeUpdateRequest {
  name?: string;
  address?: AddressRequest;
}

export interface ApplicationReceivedResponse {
  id: number;
  detail: string | null;
  status: string | null;
  content: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuthSessionResponse {
  familyId: string;
  userId: number;
  deviceLabel: string;
  firstSeenAt: string;
  lastRefreshAt: string;
  lastIp: string;
  lastUserAgent: string;
}

export interface DeviceFcmTokenInfo {
  id: number;
  fcmToken: string;
  platform: string | null;
  deviceLabel: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

export interface UserSessionResponse {
  familyId: string;
  userId: number;
  deviceLabel: string;
  firstSeenAt: string;
  lastRefreshAt: string;
  lastIp: string;
  lastUserAgent: string;
  fcmTokens: DeviceFcmTokenInfo[];
}

export interface CoverageAreaResponse {
  stateId: number;
  cityId: number | null;
}

export interface CoverageAreaRequest {
  stateId: number;
  cityId: number | null;
}

export interface RegionResponse {
  id: number;
  name: string;
  address: Record<string, unknown> | null;
  coverage: CoverageAreaResponse[] | null;
}

export interface FranchiseResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  responsible: string;
  createdAt: string;
  coverage: CoverageAreaResponse[] | null;
}

export interface RegionRequest {
  name: string;
  address: Record<string, unknown> | null;
  coverage: CoverageAreaRequest[];
}

export interface RegionUpdateRequest {
  name?: string;
  address?: Record<string, unknown> | null;
  coverage?: CoverageAreaRequest[];
}

export interface FranchiseRequest {
  name: string;
  email?: string;
  phone?: string;
  responsible?: string;
  coverage: CoverageAreaRequest[];
}

export interface FranchiseUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  responsible?: string;
  coverage?: CoverageAreaRequest[];
}
