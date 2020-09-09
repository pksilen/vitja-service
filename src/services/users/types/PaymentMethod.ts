import { IsCreditCard, Matches, MaxLength } from "class-validator";
import { UseTestValue } from '../../../backk/UseTestValue';
import Entity from "../../../backk/Entity";

@Entity
export default class PaymentMethod {
  @MaxLength(24)
  id!: string;
  paymentMethodType!: 'creditCard';

  @IsCreditCard()
  @MaxLength(19)
  @UseTestValue('4111 1111 1111 1111')
  creditCardNumber!: string;

  @MaxLength(5)
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
  @UseTestValue('11/21')
  creditCardExpiration!: string;

  @MaxLength(4)
  @Matches(/^[0-9]{3,4}$/)
  @UseTestValue('345')
  cardVerificationCode!: string;
}
