import { BackkError } from "../../backk/types/BackkError";
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
  abstract deleteAllUserAccounts(): Promise<BackkError | null>;

  // createUserAccount documentation goes here..
  abstract createUserAccount(arg: UserAccount): Promise<[UserAccountResponse, BackkError | null]>;

  abstract getUserAccount(arg: UserName): Promise<[UserAccountResponse, BackkError | null]>;
  abstract getUserAccountById(arg: _Id): Promise<[UserAccountResponse, BackkError | null]>;
  abstract addToFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<[UserAccountResponse, BackkError | null]>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): Promise<[UserAccountResponse, BackkError | null]>;
  abstract followUser(arg: _IdAndFollowedUserId): Promise<[UserAccountResponse, BackkError | null]>;
  abstract unfollowUser(arg: _IdAndFollowedUserId): Promise<[UserAccountResponse, BackkError | null]>;
  abstract updateUserAccount(arg: UserAccount): Promise<BackkError | null>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): Promise<BackkError | null>;
  abstract deleteUserAccount(arg: _Id): Promise<BackkError | null>;

  abstract getCities(): Promise<[Name[], BackkError | null]>;
}
