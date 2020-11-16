import AuditLoggingService from "../../backk/observability/logging/audit/AuditLoggingService";
import { AuditLogEntry } from "../../backk/observability/logging/audit/AuditLogEntry";

export default class AuditLoggingServiceImpl implements AuditLoggingService {
  log(auditLogEntry: AuditLogEntry): Promise<void> {
    // send audit log entry here to a remote audit log server using e.g. call or sendTo
    return Promise.resolve();
  }
}
