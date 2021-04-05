import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import _Id from "../../backk/types/id/_Id";
import GetUsersArg from "./types/args/GetUsersArg";
import User from "./types/entities/User";
import { PromiseErrorOr } from "../../backk/types/PromiseErrorOr";

export default abstract class UserService extends CrudEntityService {
  abstract getUsers(arg: GetUsersArg): PromiseErrorOr<User[]>;
  abstract getUser(arg: _Id): PromiseErrorOr<User>;
}
