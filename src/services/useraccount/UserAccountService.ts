import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import UserAccount from "./types/entities/UserAccount";
import _IdAndFollowedUserAccountId from "./types/args/_IdAndFollowedUserAccountId";
import { Name } from "../../backk/types/Name";
import UserAccountBaseService from "../../backk/service/useraccount/UserAccountBaseService";
import _IdAndSalesItemId from "./types/args/_IdAndSalesItemId";
import UserName from "../../backk/types/useraccount/UserName";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

/** Users service doc goes here
 * - jee
 * - jaa
 * **/
export default abstract class UserAccountService extends UserAccountBaseService {
  abstract deleteAllUserAccounts(): PromiseOfErrorOr<null>;

  // createUserAccount documentation goes here..
  abstract createUserAccount(arg: UserAccount): PromiseOfErrorOr<UserAccount>;

  abstract getUserAccount(arg: UserName): PromiseOfErrorOr<UserAccount>;
  abstract getUserNameById(arg: _Id): PromiseOfErrorOr<UserName>;
  abstract addToFavoriteSalesItems(arg: _IdAndSalesItemId): PromiseOfErrorOr<UserAccount>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndSalesItemId): PromiseOfErrorOr<UserAccount>;
  abstract followUser(arg: _IdAndFollowedUserAccountId): PromiseOfErrorOr<UserAccount>;
  abstract unfollowUser(arg: _IdAndFollowedUserAccountId): PromiseOfErrorOr<UserAccount>;
  abstract updateUserAccount(arg: UserAccount): PromiseOfErrorOr<null>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): PromiseOfErrorOr<null>;
  abstract deleteUserAccount(arg: _Id): PromiseOfErrorOr<null>;

  abstract getCities(): PromiseOfErrorOr<Name[]>;
}
