import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import UserAccount from "./types/entities/UserAccount";
import _IdAndFollowedUserAccountId from "./types/args/_IdAndFollowedUserAccountId";
import { Name } from "../../backk/types/Name";
import UserAccountBaseService from "../../backk/service/useraccount/UserAccountBaseService";
import _IdAndFavoriteSalesItem from "./types/args/_IdAndFavoriteSalesItem";
import UserName from "../../backk/types/useraccount/UserName";
import { ErrorOr } from "../../backk/types/ErrorOr";

/** Users service doc goes here
 * - jee
 * - jaa
 * **/
export default abstract class UserAccountService extends UserAccountBaseService {
  abstract deleteAllUserAccounts(): ErrorOr<null>;

  // createUserAccount documentation goes here..
  abstract createUserAccount(arg: UserAccount): ErrorOr<UserAccount>;

  abstract getUserAccount(arg: UserName): ErrorOr<UserAccount>;
  abstract getUserAccountById(arg: _Id): ErrorOr<UserAccount>;
  abstract addToFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): ErrorOr<UserAccount>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndFavoriteSalesItem): ErrorOr<UserAccount>;
  abstract followUser(arg: _IdAndFollowedUserAccountId): ErrorOr<UserAccount>;
  abstract unfollowUser(arg: _IdAndFollowedUserAccountId): ErrorOr<UserAccount>;
  abstract updateUserAccount(arg: UserAccount): ErrorOr<null>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): ErrorOr<null>;
  abstract deleteUserAccount(arg: _Id): ErrorOr<null>;

  abstract getCities(): ErrorOr<Name[]>;
}
