import User from "./User";
import { ExpectTestValueOfType } from "../../../backk/ExpectTestValueOfType";
import { Matches } from "class-validator";
import { UseTestValue } from "../../../backk/UseTestValue";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";

export default class UserResponse extends User {
  _id!: string;
  userName!: string;
  streetAddress!: string;
  postalCode!: string;
  city!: string;
  defaultPaymentMethod!: DefaultPaymentMethod;
  paymentMethods!: PaymentMethod[];

  @UseTestValue('123')
  favoriteSalesItemIds!: string[];

  @ExpectTestValueOfType('string')
  extraInfo!: string;
}
