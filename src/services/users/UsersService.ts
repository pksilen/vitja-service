import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import PaymentMethod from './types/PaymentMethod';
import PaymentMethodAndUserId from './types/PaymentMethodAndUserId';
import { PaymentMethodIdAndUserId } from './types/PaymentMethodIdAndUserId';
import PaymentMethodWithoutId from './types/PaymentMethodWithoutId';
import SalesItemIdAndUserId from './types/SalesItemIdAndUserId';
import User from './types/User';
import UserNameWrapper from './types/UserNameWrapper';
import UserWithoutId from './types/UserWithoutId';

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
  abstract createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse>;
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
