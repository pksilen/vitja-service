import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import GetUsersArg from "./types/args/GetUsersArg";
import User from "./types/entities/User";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

export default abstract class UserService extends CrudResourceService {
  abstract getUsers(arg: GetUsersArg): PromiseOfErrorOr<User[]>;
  abstract getUser(arg: _Id): PromiseOfErrorOr<User>;
}
