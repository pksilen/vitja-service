import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import UserAccount from "./types/entities/UserAccount";
import _IdAndFollowedUserId from "./types/args/_IdAndFollowedUserId";
import { Name } from "../../backk/types/Name";
import UserAccountBaseService from "../../backk/service/useraccount/UserAccountBaseService";
import _IdAndFavoriteSalesItem from "./types/args/_IdAndFavoriteSalesItem";
import UserAccountResponse from "./types/responses/UserAccountResponse";
import UserName from "../../backk/types/useraccount/UserName";

/** Users service doc goes here
 * - jee
 * - jaa
 * **/
export default abstract class UserAccountService extends UserAccountBaseService {
  abstract deleteAllUserAccounts(): Promise<void | ErrorResponse>;

  // createUserAccount documentation goes here..
  abstract createUserAccount(arg: UserAccount): Promise<UserAccountResponse | ErrorResponse>;

  abstract getUserAccount(arg: UserName): Promise<UserAccountResponse | ErrorResponse>;
  abstract getUserAccountById(arg: _Id): Promise<UserAccountResponse | ErrorResponse>;
  abstract addToFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<UserAccount | ErrorResponse>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<UserAccount | ErrorResponse>;
  abstract followUser(arg: _IdAndFollowedUserId): Promise<UserAccount | ErrorResponse>;
  abstract unfollowUser(arg: _IdAndFollowedUserId): Promise<UserAccount | ErrorResponse>;
  abstract updateUserAccount(arg: UserAccount): Promise<void | ErrorResponse>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse>;
  abstract deleteUserAccount(arg: _Id): Promise<void | ErrorResponse>;

  abstract getCities(): Promise<Name[] | ErrorResponse>;
}
