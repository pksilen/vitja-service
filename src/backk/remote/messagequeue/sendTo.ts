import { CompressionTypes } from 'kafkajs';
import { ErrorResponse } from '../../types/ErrorResponse';
import { getNamespace } from 'cls-hooked';
import { Send } from './sendInsideTransaction';
import sendOneOrMoreToKafka, { SendAcknowledgementType } from './kafka/sendOneOrMoreToKafka';
import sendOneOrMoreToRedis from './redis/sendOneOrMoreToRedis';
import parseRemoteServiceFunctionCallUrlParts from '../utils/parseRemoteServiceFunctionCallUrlParts';

export interface SendToOptions {
  compressionType?: CompressionTypes;
  sendAcknowledgementType?: SendAcknowledgementType;
}

export async function sendOneOrMore(sends: Send[], isTransactional: boolean): Promise<void | ErrorResponse> {
  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('mutatingRemoteServiceCallCount', clsNamespace?.get('mutatingRemoteServiceCallCount') + 1);

  const { scheme } = parseRemoteServiceFunctionCallUrlParts(sends[0].serviceFunctionCallUrl);

  if (scheme === 'kafka') {
    return await sendOneOrMoreToKafka(sends, isTransactional);
  } else if (scheme === 'redis') {
    return await sendOneOrMoreToRedis(sends, isTransactional);
  }
}

export default async function sendTo(
  serviceFunctionCallUrl: string,
  serviceFunctionArgument: object,
  responseUrl?: string,
  options?: SendToOptions
): Promise<void | ErrorResponse> {
  return await sendOneOrMore(
    [
      {
        serviceFunctionCallUrl,
        serviceFunctionArgument,
        responseUrl,
        options
      }
    ],
    false
  );
}
