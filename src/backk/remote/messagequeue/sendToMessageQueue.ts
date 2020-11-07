import sendTo from "./sendTo";

export default async function sendToMessageQueue(broker: string, topic: string, key: string, message: object) {
  const remoteServiceUrl = 'kafka://' + broker + '/' + topic;
  return await sendTo(remoteServiceUrl, key, message);
}