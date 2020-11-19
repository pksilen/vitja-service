import UsersBaseService from "../../backk/users/UsersBaseService";
import CreateUserArg from "./types/args/CreateUserArg";
import UpdateUserArg from "./types/args/UpdateUserArg";
import UserName from "./types/args/UserName";
import UserResponse from "./types/responses/UserResponse";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";

export default abstract class UsersService extends UsersBaseService {
  abstract deleteAllUsers(): Promise<void | ErrorResponse>;
  abstract createUser(arg: CreateUserArg): Promise<UserResponse | ErrorResponse>;
  abstract getUserByUserName(arg: UserName): Promise<UserResponse | ErrorResponse>;
  abstract getUserById(arg: _Id): Promise<UserResponse | ErrorResponse>;
  abstract updateUser(arg: UpdateUserArg): Promise<void | ErrorResponse>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse>;
  abstract deleteUserById(arg: _Id): Promise<void | ErrorResponse>;
}
