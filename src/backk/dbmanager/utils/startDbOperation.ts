import log, { Severity } from "../../observability/logging/log";

export default function startDbOperation(dbManagerOperationName: string): number {
  log(Severity.DEBUG, 'Database manager operation', dbManagerOperationName);
  return Date.now();
}
