import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import UserAccount from "./types/entities/UserAccount";
import { Name } from "../../backk/types/Name";
import UserAccountBaseService from "../../backk/service/useraccount/UserAccountBaseService";
import _IdAndSalesItemId from "./types/args/_IdAndSalesItemId";
import UserName from "../../backk/types/useraccount/UserName";
import { PromiseErrorOr } from "../../backk/types/PromiseErrorOr";
import GetUserAccountArg from "./types/args/GetUserAccountArg";
import _IdAndFollowedUserAccountId from "./types/args/_IdAndFollowedUserAccountId";

/** Users service doc goes here
 * - jee
 * - jaa
 * **/
export default abstract class UserAccountService extends UserAccountBaseService {
  abstract deleteAllUserAccounts(): PromiseErrorOr<null>;

  // createUserAccount documentation goes here..
  abstract createUserAccount(arg: UserAccount): PromiseErrorOr<UserAccount>;

  abstract getUserNameById(arg: _Id): PromiseErrorOr<UserName>;
  abstract getUserAccount(arg: GetUserAccountArg): PromiseErrorOr<UserAccount>;
  abstract followUser(arg: _IdAndFollowedUserAccountId): PromiseErrorOr<null>;
  abstract unfollowUser(arg: _IdAndFollowedUserAccountId): PromiseErrorOr<null>;
  abstract addToFavoriteSalesItems(arg: _IdAndSalesItemId): PromiseErrorOr<null>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndSalesItemId): PromiseErrorOr<null>;
  abstract updateUserAccount(arg: UserAccount): PromiseErrorOr<null>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): PromiseErrorOr<null>;
  abstract deleteUserAccount(arg: _Id): PromiseErrorOr<null>;

  abstract getCities(): PromiseErrorOr<Name[]>;
}
