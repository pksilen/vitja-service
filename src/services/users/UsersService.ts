import UserName from "./types/args/UserName";
import UserResponse from "./types/responses/UserResponse";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import User from "./types/entities/User";
import _IdAndFollowedUserId from "./types/args/_IdAndFollowedUserId";
import { Name } from "../../backk/types/Name";
import UsersBaseService from "../../backk/users/UsersBaseService";
import GetUsersArg from "./types/args/GetUsersArg";
import PublicUser from "./types/entities/PublicUser";
import _IdAndFavoriteSalesItem from "./types/args/_IdAndFavoriteSalesItem";

export default abstract class UsersService extends UsersBaseService {
  abstract deleteAllUsers(): Promise<void | ErrorResponse>;
  abstract createUser(arg: User): Promise<UserResponse | ErrorResponse>;
  abstract getUsers(arg: GetUsersArg): Promise<PublicUser[] | ErrorResponse>;
  abstract getUser(arg: UserName): Promise<UserResponse | ErrorResponse>;
  abstract getUserById(arg: _Id): Promise<UserResponse | ErrorResponse>;
  abstract addToFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<User | ErrorResponse>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<User | ErrorResponse>;
  abstract followUser(arg: _IdAndFollowedUserId): Promise<User | ErrorResponse>;
  abstract unfollowUser(arg: _IdAndFollowedUserId): Promise<User | ErrorResponse>;
  abstract updateUser(arg: User): Promise<void | ErrorResponse>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse>;
  abstract deleteUser(arg: _Id): Promise<void | ErrorResponse>;

  abstract getCities(): Promise<Name[] | ErrorResponse>;
}
