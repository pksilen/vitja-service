import _ from 'lodash';
import { sendOneOrMore, SendToOptions } from './sendTo';
import parseRemoteServiceFunctionCallUrlParts from '../utils/parseRemoteServiceFunctionCallUrlParts';

export interface Send {
  serviceFunctionCallUrl: string;
  serviceFunctionArgument: object;
  responseUrl?: string;
  options?: SendToOptions;
}

export default async function sendInsideTransaction(sends: Send[]) {
  const uniqueSendTosByBroker = _.uniqBy(
    sends,
    ({ serviceFunctionCallUrl }) => parseRemoteServiceFunctionCallUrlParts(serviceFunctionCallUrl).broker
  );

  if (uniqueSendTosByBroker.length > 1) {
    throw new Error('All sendTos must be to same broker');
  }

  return await sendOneOrMore(sends, true);
}
