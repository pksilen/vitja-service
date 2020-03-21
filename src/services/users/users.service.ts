import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import { IsArray, IsIn, IsInstance, IsInt, IsString } from 'class-validator';

export class ShoppingCartItemWithoutId {
  @IsString()
  salesItemId!: string;

  @IsInt()
  quantity!: number;
}

export class ShoppingCartItem extends ShoppingCartItemWithoutId {
  @IsString()
  _id!: string;
}

export class PaymentMethodWithoutId {
  /** @IsIn(['creditCard']) **/
  @IsIn(['creditCard'])
  paymentMethodType!: string;

  @IsString()
  creditCardNumber!: string;

  @IsString()
  creditCardExpiration!: string;

  @IsString()
  cardVerificationCode!: string;
}

export class PaymentMethod extends PaymentMethodWithoutId {
  @IsString()
  _id!: string;
}

export class UserNameWrapper {
  @IsString()
  userName!: string;
}

export class UserWithoutId {
  @IsString()
  userName!: string;

  @IsString()
  password!: string;

  @IsString()
  streetAddress!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  city!: string;

  @IsInstance(PaymentMethod)
  defaultPaymentMethod!: PaymentMethod;

  @IsInstance(PaymentMethod, { each: true})
  @IsArray()
  paymentMethods!: PaymentMethod[];

  @IsString({ each: true })
  @IsArray()
  favoriteSalesItemIds!: string[];

  @IsInstance(ShoppingCartItem, { each: true})
  @IsArray()
  shoppingCartItems!: ShoppingCartItem[];
}

export class User extends UserWithoutId {
  @IsString()
  _id!: string;
}

export class PaymentMethodAndUserId extends PaymentMethod {
  @IsString()
  userId!: string;
}

export class PaymentMethodIdAndUserId {
  @IsString()
  paymentMethodId!: string;

  @IsString()
  userId!: string;
}

export class SalesItemIdAndUserId {
  @IsString()
  salesItemId!: string;

  @IsString()
  userId!: string;
}

export default abstract class UsersService {
  readonly Types = {
    IdWrapper,
    PaymentMethod,
    PaymentMethodAndUserId,
    PaymentMethodIdAndUserId,
    PaymentMethodWithoutId,
    SalesItemIdAndUserId,
    User,
    UserNameWrapper,
    UserWithoutId
  };

  abstract getUserByUserName(userNameWrapper: UserNameWrapper): Promise<User | ErrorResponse>;
  readonly GetUserByUserNameReturnValueType = User;

  abstract createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse>;
  readonly CreateUserReturnValueType = IdWrapper;

  abstract deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
  abstract updateUser(user: User): Promise<void | ErrorResponse>;

  abstract addPaymentMethodForUserById(
    paymentMethodAndUserId: PaymentMethodAndUserId
  ): Promise<void | ErrorResponse>;

  abstract removePaymentMethodByIdFromUserById(
    paymentMethodAndUserId: PaymentMethodIdAndUserId
  ): Promise<void | ErrorResponse>;

  abstract addFavoriteSalesItemByIdToUserById(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse>;

  abstract removeFavoriteSalesItemByIdFromUserById(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse>;

  abstract addSalesItemByIdToUserByIdShoppingCart(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse>;

  abstract removeSalesItemByIdFromUserByIdShoppingCart(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse>;
}
