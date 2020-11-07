import _ from 'lodash';
import { parseRemoteServiceUrlParts, sendOneOrMore, SendToOptions } from "./sendTo";

export interface Send {
  remoteServiceUrl: string;
  serviceFunction: string;
  serviceFunctionArgument: object;
  options?: SendToOptions;
}

export default async function sendInsideTransaction(sends: Send[]) {
  const uniqueSendTosByBroker = _.uniqBy(sends, ({ remoteServiceUrl }) =>
    parseRemoteServiceUrlParts(remoteServiceUrl).broker
  );

  if (uniqueSendTosByBroker.length > 1) {
    throw new Error('All sendTos must be to same broker');
  }

  return await sendOneOrMore(sends, true);
}
