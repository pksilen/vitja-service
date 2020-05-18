import { Matches } from 'class-validator';
import PaymentMethod from './PaymentMethod';
import { UseTestValue } from '../../../backk/UseTestValue';
import DefaultPaymentMethod from "./DefaultPaymentMethod";

export default class UserWithoutId {
  userName!: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @UseTestValue('Jepulis0!')
  password!: string;

  streetAddress!: string;
  postalCode!: string;
  city!: string;
  defaultPaymentMethod!: DefaultPaymentMethod;
  paymentMethods!: PaymentMethod[];

  @UseTestValue('123')
  favoriteSalesItemIds!: string[];
}
