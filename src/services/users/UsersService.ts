import UsersBaseService from '../../backk/UsersBaseService';
import CreateUserArg from './types/args/CreateUserArg';
import UpdateUserArg from './types/args/UpdateUserArg';
import UserName from './types/args/UserName';
import DefaultPaymentMethod from './types/entities/DefaultPaymentMethod';
import PaymentMethod from './types/entities/PaymentMethod';
import User from './types/entities/User';
import UserResponse from './types/responses/UserResponse';
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import Id from "../../backk/types/Id";

export default abstract class UsersService extends UsersBaseService {
  readonly Types = {
    DefaultPaymentMethod,
    PaymentMethod,
    UpdateUserArg,
    User,
    UserName,
    CreateUserArg,
    UserResponse
  };

  abstract deleteAllUsers(): Promise<void | ErrorResponse>;
  abstract createUser(arg: CreateUserArg): Promise<UserResponse | ErrorResponse>;
  abstract getUserByUserName(userName: UserName): Promise<UserResponse | ErrorResponse>;
  abstract getUserById(id: Id): Promise<UserResponse | ErrorResponse>;
  abstract updateUser(updateUserArg: UpdateUserArg): Promise<void | ErrorResponse>;
  abstract deleteUserById(id: Id): Promise<void | ErrorResponse>;
}
