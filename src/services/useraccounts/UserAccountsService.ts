import UserName from "./types/args/UserName";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import UserAccount from "./types/entities/UserAccount";
import _IdAndFollowedUserId from "./types/args/_IdAndFollowedUserId";
import { Name } from "../../backk/types/Name";
import UserAccountsBaseService from "../../backk/service/useraccounts/UserAccountsBaseService";
import _IdAndFavoriteSalesItem from "./types/args/_IdAndFavoriteSalesItem";
import UserAccountResponse from "./types/responses/UserAccountResponse";

/** Users service doc goes here
 * - jee
 * - jaa
 * **/
export default abstract class UserAccountsService extends UserAccountsBaseService {
  abstract deleteAllUsers(): Promise<void | ErrorResponse>;

  // createUser documentation goes here..
  abstract createUser(arg: UserAccount): Promise<UserAccountResponse | ErrorResponse>;

  abstract getUser(arg: UserName): Promise<UserAccountResponse | ErrorResponse>;
  abstract getUserAccountById(arg: _Id): Promise<UserAccountResponse | ErrorResponse>;
  abstract addToFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<UserAccount | ErrorResponse>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<UserAccount | ErrorResponse>;
  abstract followUser(arg: _IdAndFollowedUserId): Promise<UserAccount | ErrorResponse>;
  abstract unfollowUser(arg: _IdAndFollowedUserId): Promise<UserAccount | ErrorResponse>;
  abstract updateUser(arg: UserAccount): Promise<void | ErrorResponse>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse>;
  abstract deleteUser(arg: _Id): Promise<void | ErrorResponse>;

  abstract getCities(): Promise<Name[] | ErrorResponse>;
}
