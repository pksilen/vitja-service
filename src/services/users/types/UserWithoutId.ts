import { Matches } from 'class-validator';
import PaymentMethod from './PaymentMethod';
import { TestValue } from '../../../backk/TestValue';

export default class UserWithoutId {
  userName!: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @TestValue('Jepulis0!')
  password!: string;

  streetAddress!: string;
  postalCode!: string;
  city!: string;
  defaultPaymentMethod!: PaymentMethod;
  paymentMethods!: PaymentMethod[];
  favoriteSalesItemIds!: string[];
}
