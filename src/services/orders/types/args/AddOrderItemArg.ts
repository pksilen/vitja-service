import ETag from "../../../../backk/types/ETag";

export default class AddOrderItemArg extends ETag {
  orderId!: string;
  salesItemId!: string;
}
