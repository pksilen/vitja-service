import consumeFromKafka from "./kafka/consumeFromKafka";

export default async function consumeFrom(
  controller: any,
  remoteServiceUrl: string
) {
  consumeFromKafka(controller, remoteServiceUrl);
}
