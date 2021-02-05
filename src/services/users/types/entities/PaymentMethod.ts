import { IsCreditCard, MaxLength } from "class-validator";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsCreditCardExpiration from "../../../../backk/decorators/typeproperty/IsCreditCardExpiration";
import IsCardVerificationCode from "../../../../backk/decorators/typeproperty/isCardVerificationCode";

@Entity()
export default class PaymentMethod extends Id {
  public paymentMethodType!: 'creditCard';

  @IsCreditCard()
  @MaxLength(19)
  public creditCardNumber!: string;

  @MaxLength(7)
  @IsCreditCardExpiration()
  public creditCardExpiration!: string;

  @MaxLength(4)
  @IsCardVerificationCode()
  public cardVerificationCode!: string;
}
