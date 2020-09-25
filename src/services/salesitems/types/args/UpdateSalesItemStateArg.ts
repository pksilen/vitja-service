import { Id } from "../../../../backk/Backk";

export default class UpdateSalesItemStateArg extends Id{
  state!: 'forSale' | 'sold';
}
