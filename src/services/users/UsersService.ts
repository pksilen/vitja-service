import UserName from './types/args/UserName';
import UserResponse from './types/responses/UserResponse';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import _Id from '../../backk/types/id/_Id';
import ChangeUserPasswordArg from './types/args/ChangeUserPasswordArg';
import User from './types/entities/User';
import CrudResourceService from '../../backk/crudresource/CrudResourceService';
import _IdAndFollowedUserId from './types/args/_IdAndFollowedUserId';
import { Name } from "../../backk/types/Name";

export default abstract class UsersService extends CrudResourceService {
  abstract deleteAllUsers(): Promise<void | ErrorResponse>;
  abstract createUser(arg: User): Promise<UserResponse | ErrorResponse>;
  abstract getCities(): Promise<Name[] | ErrorResponse>;
  abstract getUserByUserName(arg: UserName): Promise<UserResponse | ErrorResponse>;
  abstract getUserById(arg: _Id): Promise<UserResponse | ErrorResponse>;
  abstract followUser(arg: _IdAndFollowedUserId): Promise<User | ErrorResponse>;
  abstract unfollowUser(arg: _IdAndFollowedUserId): Promise<User | ErrorResponse>;
  abstract updateUser(arg: User): Promise<void | ErrorResponse>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse>;
  abstract deleteUserById(arg: _Id): Promise<void | ErrorResponse>;
}
