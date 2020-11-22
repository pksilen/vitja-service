import { IsCreditCard, MaxLength } from "class-validator";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";

@Entity()
export default class PaymentMethod extends Id {
  paymentMethodType!: 'creditCard';

  @IsCreditCard()
  @MaxLength(19)
  @TestValue('4111 1111 1111 1111')
  creditCardNumber!: string;

  @MaxLengthAndMatches(5, /^(0[1-9]|1[0-2])\/([0-9]{2})$/)
  @TestValue('11/21')
  creditCardExpiration!: string;

  @MaxLengthAndMatches(4, /^[0-9]{3,4}$/)
  @TestValue('345')
  cardVerificationCode!: string;
}
