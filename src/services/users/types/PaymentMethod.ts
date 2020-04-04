import { IsCreditCard, Matches } from 'class-validator';
import { TestValue } from '../../../backk/TestValue';

export default class PaymentMethod {
  id!: string;
  paymentMethodType!: 'creditCard';

  @IsCreditCard()
  @TestValue('4111 1111 1111 1111')
  creditCardNumber!: string;

  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
  @TestValue('11/21')
  creditCardExpiration!: string;

  @Matches(/^[0-9]{3,4}$/)
  @TestValue('345')
  cardVerificationCode!: string;
}
