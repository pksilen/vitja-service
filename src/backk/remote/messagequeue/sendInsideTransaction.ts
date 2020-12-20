import _ from 'lodash';
import { sendOneOrMore, SendToOptions } from './sendToRemoteService';
import parseRemoteServiceFunctionCallUrlParts from '../utils/parseRemoteServiceFunctionCallUrlParts';

export interface CallOrSendTo {
  remoteServiceFunctionUrl: string;
  serviceFunctionArgument?: object;
  responseUrl?: string;
  options?: SendToOptions;
}

export default async function sendInsideTransaction(sends: CallOrSendTo[]) {
  const uniqueSendTosByBroker = _.uniqBy(
    sends,
    ({ remoteServiceFunctionUrl }) => parseRemoteServiceFunctionCallUrlParts(remoteServiceFunctionUrl).broker
  );

  if (uniqueSendTosByBroker.length !== 1) {
    throw new Error('All sendTos must be to same Kafka broker');
  }

  return await sendOneOrMore(sends, true);
}
