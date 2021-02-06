import { IsCreditCard } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import IsCreditCardExpiration from "../../../../backk/decorators/typeproperty/IsCreditCardExpiration";
import IsCardVerificationCode from "../../../../backk/decorators/typeproperty/isCardVerificationCode";

@Entity()
export default class PaymentMethod extends Id {
  public paymentMethodType!: 'creditCard';

  @IsCreditCard()
  public creditCardNumber!: string;

  @IsCreditCardExpiration()
  public creditCardExpiration!: string;

  @IsCardVerificationCode()
  public cardVerificationCode!: string;
}
