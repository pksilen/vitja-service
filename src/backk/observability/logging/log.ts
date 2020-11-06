/* eslint-disable @typescript-eslint/camelcase */
import { LogEntry } from './LogEntry';
import * as fs from 'fs';
import tracerProvider from '../distributedtracinig/initializeTracing';

export type Severity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const severityToSeverityNumberMap: { [key: string]: number } = {
  DEBUG: 5,
  INFO: 9,
  WARN: 13,
  ERROR: 17,
  FATAL: 21
};

const cwd = process.cwd();
const serviceName = cwd.split('/').reverse()[0];

const packageJson = fs.readFileSync(cwd + '/package.json', { encoding: 'UTF-8' });
const packageObj = JSON.parse(packageJson);

if (
  process.env.NODE_ENV !== 'development' &&
  (!process.env.NODE_NAME || !process.env.SERVICE_NAMESPACE || !process.env.SERVICE_INSTANCE_ID)
) {
  throw new Error(
    'NODE_NAME, SERVICE_NAMESPACE and SERVICE_INSTANCE_ID environment variables must be defined'
  );
}

export default function log(
  severity: Severity,
  name: string,
  body: string,
  attributes?: { [key: string]: string | number | boolean | undefined }
) {
  const severityNumber = severityToSeverityNumberMap[severity];
  const minLoggingSeverityNumber = severityToSeverityNumberMap[process.env.LOG_LEVEL ?? 'INFO'];

  if (severityNumber >= minLoggingSeverityNumber) {
    const logEntry: LogEntry = {
      Timestamp: Date.now() + '000000',
      TraceId: tracerProvider
        .getTracer('default')
        .getCurrentSpan()
        ?.context().traceId,
      SpanId: tracerProvider
        .getTracer('default')
        .getCurrentSpan()
        ?.context().spanId,
      TraceFlags: tracerProvider
        .getTracer('default')
        .getCurrentSpan()
        ?.context().traceFlags,
      SeverityText: severity,
      SeverityNumber: severityNumber,
      Name: name,
      Body: body,
      Resource: {
        'service.name': serviceName,
        'service.namespace': process.env.SERVICE_NAMESPACE ?? '',
        'service.instance.id': process.env.SERVICE_INSTANCE_ID ?? '',
        'service.version': packageObj.version,
        'node.name': process.env.NODE_NAME ?? ''
      },
      Attributes: {
        timeZoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...attributes
      }
    };

    console.log(logEntry);
  }
}

export function logError(error: Error) {
  log('ERROR', error.message, error.stack ?? '');
}
