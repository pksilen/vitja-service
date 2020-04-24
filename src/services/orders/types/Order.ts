import OrderWithoutId from './OrderWithoutId';
import Entity from "../../../backk/Entity";

@Entity
export default class Order extends OrderWithoutId {
  _id!: string;
}
