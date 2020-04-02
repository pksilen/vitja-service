import { IsCreditCard, Matches } from 'class-validator';

export default class PaymentMethod {
  id!: string;

  paymentMethodType!: 'creditCard';

  @IsCreditCard()
  creditCardNumber!: string;

  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/g)
  creditCardExpiration!: string;

  @Matches(/^[0-9]{3,4}$/g)
  cardVerificationCode!: string;
}
