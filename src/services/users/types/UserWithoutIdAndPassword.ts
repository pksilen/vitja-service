import { MaxLength } from "class-validator";
import { UseTestValue } from "../../../backk/UseTestValue";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";

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
  @UseTestValue('123')
  favoriteSalesItemIds!: string[];
}