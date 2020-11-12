import { Resource } from '../LogEntry';

export type UserOperation =
  | 'loginUser'
  | 'lockAccount'
  | 'forgotPassword'
  | 'logoutUser'
  | 'changePassword'
  | 'addUser'
  | 'removeUser'
  | 'assignUserToRole'
  | 'removeRoleFromUser'
  | 'addUserToGroup'
  | 'removeUserFromGroup'

export type UserOperationResult = 'success' | 'failure'

export interface AuditLogEntry {
  Timestamp: string;
  TraceId?: string;
  SpanId?: string;
  TraceFlags?: number;
  userName: string;
  clientIp: string;
  accessToken: string;
  userOperation: UserOperation | string;
  userOperationResult: UserOperationResult;
  userOperationHttpStatusCode: number;
  userOperationErrorMessage: string;
  Resource: Resource;
  Attributes?: { [key: string]: string | number | boolean | undefined };
}
