import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import PaymentMethod from './types/PaymentMethod';
import User from './types/User';
import UserNameWrapper from './types/UserNameWrapper';
import UserWithoutId from './types/UserWithoutId';
import DefaultPaymentMethod from "./types/DefaultPaymentMethod";
import UserResponse from "./types/UserResponse";

export default abstract class UsersService {
  readonly Types = {
    DefaultPaymentMethod,
    IdWrapper,
    PaymentMethod,
    User,
    UserNameWrapper,
    UserWithoutId,
    UserResponse
  };

  abstract deleteAllUsers(): Promise<void | ErrorResponse>;
  abstract createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract getUserByUserName(userNameWrapper: UserNameWrapper): Promise<UserResponse | ErrorResponse>;
  abstract updateUser(user: User): Promise<void | ErrorResponse>;
  abstract deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
