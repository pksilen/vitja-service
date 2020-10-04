import { Matches, MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import DefaultPaymentMethod from './DefaultPaymentMethod';
import PaymentMethod from './PaymentMethod';

@Entity()
export default class User {
  @MaxLength(24)
  _id!: string;

  @MaxLength(512)
  userName!: string;

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
