import consumeFromKafka from "./kafka/consumeFromKafka";

export default async function consumeFrom(
  controller: any,
  broker: string
) {
  consumeFromKafka(controller, broker);
}
