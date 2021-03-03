import { IsCreditCard } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import IsCreditCardExpiration from "../../../../backk/decorators/typeproperty/IsCreditCardExpiration";
import IsCardVerificationCode from "../../../../backk/decorators/typeproperty/isCardVerificationCode";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

@Entity()
export default class PaymentMethod extends Id {
  @TestValue(true)
  public isDefault!: boolean;

  public paymentMethodType!: 'creditCard';

  @IsCreditCard()
  public creditCardNumber!: string;

  @IsCreditCardExpiration()
  public creditCardExpiration!: string;

  @IsCardVerificationCode()
  public cardVerificationCode!: string;
}
