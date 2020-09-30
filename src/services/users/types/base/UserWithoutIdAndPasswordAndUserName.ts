import { MaxLength } from "class-validator";
import DefaultPaymentMethod from "../entities/DefaultPaymentMethod";
import PaymentMethod from "../entities/PaymentMethod";
import { ValueUsedInTests } from "../../../../backk/ValueUsedInTests";

export default class UserWithoutIdAndPasswordAndUserName {
  @MaxLength(512)
  streetAddress!: string;

  @MaxLength(32)
  postalCode!: string;

  @MaxLength(256)
  city!: string;

  loyaltyDiscountLevel!: 0 | 25 | 50;

  defaultPaymentMethod!: DefaultPaymentMethod;
  paymentMethods!: PaymentMethod[];

  @MaxLength(24, { each: true})
  @ValueUsedInTests('123')
  favoriteSalesItemIds!: string[];
}
