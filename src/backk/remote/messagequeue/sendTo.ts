import { CompressionTypes } from 'kafkajs';
import { ErrorResponse } from '../../types/ErrorResponse';
import { getNamespace } from 'cls-hooked';
import { Send } from './sendInsideTransaction';
import sendOneOrMoreToKafka, { SendAcknowledgementType } from './kafka/sendOneOrMoreToKafka';
import sendOneOrMoreToRedis from './redis/sendOneOrMoreToRedis';
import parseRemoteServiceUrlParts from '../utils/parseRemoteServiceUrlParts';

export interface SendToOptions {
  compressionType?: CompressionTypes;
  sendAcknowledgementType?: SendAcknowledgementType;
}

export async function sendOneOrMore(sends: Send[], isTransactional: boolean): Promise<void | ErrorResponse> {
  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('remoteServiceCallCount', clsNamespace?.get('remoteServiceCallCount') + 1);

  const { scheme } = parseRemoteServiceUrlParts(sends[0].remoteServiceUrl);

  if (scheme === 'kafka') {
    return await sendOneOrMoreToKafka(sends, isTransactional);
  } else if (scheme === 'redis') {
    return await sendOneOrMoreToRedis(sends, isTransactional);
  }
}

export default async function sendTo(
  remoteServiceUrl: string,
  serviceFunction: string,
  serviceFunctionArgument: object,
  options?: SendToOptions
): Promise<void | ErrorResponse> {
  return await sendOneOrMore(
    [
      {
        remoteServiceUrl,
        serviceFunction,
        serviceFunctionArgument,
        options
      }
    ],
    false
  );
}
