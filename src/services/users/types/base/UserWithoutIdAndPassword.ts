import { MaxLength } from "class-validator";
import { ValueUsedInTests } from "../../../../backk/ValueUsedInTests";
import DefaultPaymentMethod from "../entities/DefaultPaymentMethod";
import PaymentMethod from "../entities/PaymentMethod";

export default class UserWithoutIdAndPassword {
  @MaxLength(512)
  userName!: string;

  @MaxLength(512)
  streetAddress!: string;

  @MaxLength(32)
  postalCode!: string;

  @MaxLength(256)
  city!: string;

  defaultPaymentMethod!: DefaultPaymentMethod;
  paymentMethods!: PaymentMethod[];

  @MaxLength(24, { each: true})
  @ValueUsedInTests('123')
  favoriteSalesItemIds!: string[];
}
