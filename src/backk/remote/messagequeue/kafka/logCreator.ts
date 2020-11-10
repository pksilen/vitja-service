import log, { severityNameToSeverityMap } from "../../../observability/logging/log";

const logCreator = () => ({ label, log: { message, ...extra } }: any) =>
  log(severityNameToSeverityMap[label], 'Message queue error', message, extra);

export default logCreator;
