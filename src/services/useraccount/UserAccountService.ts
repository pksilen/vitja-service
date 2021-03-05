import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import UserAccount from "./types/entities/UserAccount";
import { Name } from "../../backk/types/Name";
import UserAccountBaseService from "../../backk/service/useraccount/UserAccountBaseService";
import _IdAndSalesItemId from "./types/args/_IdAndSalesItemId";
import UserName from "../../backk/types/useraccount/UserName";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import GetUserAccountArg from "./types/args/GetUserAccountArg";
import FollowUserArg from "./types/args/FollowUserArg";
import UnfollowUserArg from "./types/args/UnfollowUserArg";

/** Users service doc goes here
 * - jee
 * - jaa
 * **/
export default abstract class UserAccountService extends UserAccountBaseService {
  abstract deleteAllUserAccounts(): PromiseOfErrorOr<null>;

  // createUserAccount documentation goes here..
  abstract createUserAccount(arg: UserAccount): PromiseOfErrorOr<UserAccount>;

  abstract getUserNameById(arg: _Id): PromiseOfErrorOr<UserName>;
  abstract getUserAccount(arg: GetUserAccountArg): PromiseOfErrorOr<UserAccount>;
  abstract followUser(arg: FollowUserArg): PromiseOfErrorOr<null>;
  abstract unfollowUser(arg: UnfollowUserArg): PromiseOfErrorOr<null>;
  abstract addToFavoriteSalesItems(arg: _IdAndSalesItemId): PromiseOfErrorOr<null>;
  abstract removeFromFavoriteSalesItems(arg: _IdAndSalesItemId): PromiseOfErrorOr<null>;
  abstract updateUserAccount(arg: UserAccount): PromiseOfErrorOr<null>;
  abstract changeUserPassword(arg: ChangeUserPasswordArg): PromiseOfErrorOr<null>;
  abstract deleteUserAccount(arg: _Id): PromiseOfErrorOr<null>;

  abstract getCities(): PromiseOfErrorOr<Name[]>;
}
