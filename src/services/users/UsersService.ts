import { ErrorResponse, Id } from "../../backk/Backk";
import PaymentMethod from "./types/entities/PaymentMethod";
import User from "./types/entities/User";
import UserName from "./types/args/UserName";
import CreateUserArg from "./types/args/CreateUserArg";
import DefaultPaymentMethod from "./types/entities/DefaultPaymentMethod";
import UserResponse from "./types/responses/UserResponse";
import UsersBaseService from "../../backk/UsersBaseService";
import UpdateUserArg from "./types/args/UpdateUserArg";

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
  abstract createUser(arg: CreateUserArg): Promise<Id | ErrorResponse>;
  abstract getUserByUserName(userName: UserName): Promise<UserResponse | ErrorResponse>;
  abstract getUserById(id: Id): Promise<UserResponse | ErrorResponse>;
  abstract updateUser(updateUserArg: UpdateUserArg): Promise<void | ErrorResponse>;
  abstract deleteUserById(id: Id): Promise<void | ErrorResponse>;
}
