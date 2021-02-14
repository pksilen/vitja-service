import Version from "../../../../backk/types/Version";

export default class AddOrderItemArg extends Version {
  orderId!: string;
  salesItemId!: string;
}
