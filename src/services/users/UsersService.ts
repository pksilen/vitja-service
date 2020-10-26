import UsersBaseService from "../../backk/users/UsersBaseService";
import CreateUserArg from "./types/args/CreateUserArg";
import UpdateUserArg from "./types/args/UpdateUserArg";
import UserName from "./types/args/UserName";
import DefaultPaymentMethod from "./types/entities/DefaultPaymentMethod";
import PaymentMethod from "./types/entities/PaymentMethod";
import User from "./types/entities/User";
import UserResponse from "./types/responses/UserResponse";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _Id from "../../backk/types/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";

export default abstract class UsersService extends UsersBaseService {
  readonly Types = {
    ChangeUserPasswordArg,
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
  abstract getUserById(id: _Id): Promise<UserResponse | ErrorResponse>;
  abstract updateUser(arg: UpdateUserArg): Promise<void | ErrorResponse>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse>;
  abstract deleteUserById(id: _Id): Promise<void | ErrorResponse>;
}
