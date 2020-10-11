import { Matches, MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import UniqueIndex from '../../../../backk/annotations/entity/UniqueIndex';
import { Documentation } from '../../../../backk/annotations/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/annotations/typeproperty/IsExprTrue';
import { Id } from '../../../../backk/Backk';
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import DefaultPaymentMethod from './DefaultPaymentMethod';
import PaymentMethod from './PaymentMethod';

@Entity()
@UniqueIndex(['userName'])
export default class User extends Id {
  @MaxLength(512)
  @IsExprTrue('obj.password && obj.password.length >= 8 || true')
  userName!: string;

  @Documentation('Password doc goes here...')
  @MaxLength(512)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
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
