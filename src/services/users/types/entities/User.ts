import { MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import UniqueIndex from "../../../../backk/decorators/entity/UniqueIndex";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import { IsExprTrue } from "../../../../backk/decorators/typeproperty/IsExprTrue";
import { ValueUsedInTests } from "../../../../backk/decorators/typeproperty/testing/ValueUsedInTests";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";
import _Id from "../../../../backk/types/_Id";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";

@Entity()
@UniqueIndex(['userName'])
export default class User extends _Id {
  @MaxLength(512)
  userName!: string;

  @Documentation('Password doc goes here...')
  @IsExprTrue('!obj.password.includes(obj.userName)')
  @MaxLengthAndMatches(512, /^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{8,}$/)
  @ValueUsedInTests('Jepulis0!')
  password!: string;

  @MaxLength(512)
  streetAddress!: string;

  @MaxLength(32)
  postalCode!: string;

  @MaxLength(256)
  city!: string;

  loyaltyDiscountLevel!: 0 | 25 | 50;

  defaultPaymentMethod!: DefaultPaymentMethod;
  paymentMethods!: PaymentMethod[];

  @MaxLength(24, { each: true })
  @ValueUsedInTests('123')
  favoriteSalesItemIds!: string[];
}
