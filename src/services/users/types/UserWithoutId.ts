import { IsArray, IsInstance, IsString, Matches } from 'class-validator';
import PaymentMethod from './PaymentMethod';
import ShoppingCartItem from './ShoppingCartItem';

export default class UserWithoutId {
  userName!: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  password!: string;

  streetAddress!: string;
  postalCode!: string;
  city!: string;
  defaultPaymentMethod!: PaymentMethod;
  paymentMethods!: PaymentMethod[];
  favoriteSalesItemIds!: string[];
  shoppingCartItems!: ShoppingCartItem[];
}
