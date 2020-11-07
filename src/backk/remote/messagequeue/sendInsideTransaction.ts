import _ from 'lodash';
import { parseRemoteServiceUrlParts, sendOneOrMoreTo, SendToOptions } from "./sendTo";

export interface SendTo {
  remoteServiceUrl: string;
  serviceFunction: string;
  serviceFunctionArgument: object;
  options?: SendToOptions;
}

export default async function sendInsideTransaction(sendTos: SendTo[]) {
  const uniqueSendTosByBroker = _.uniqBy(sendTos, ({ remoteServiceUrl }) =>
    parseRemoteServiceUrlParts(remoteServiceUrl).broker
  );

  if (uniqueSendTosByBroker.length > 1) {
    throw new Error('All sendTos must be to same broker');
  }

  return await sendOneOrMoreTo(sendTos, true);
}
