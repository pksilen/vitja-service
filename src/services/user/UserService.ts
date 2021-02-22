import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import GetUsersArg from "./types/args/GetUsersArg";
import { BackkError } from "../../backk/types/BackkError";
import User from "./types/entities/User";

export default abstract class UserService extends CrudResourceService {
  abstract getUsers(arg: GetUsersArg): Promise<[User[], BackkError | null]>;
  abstract getUser(arg: _Id): Promise<[User, BackkError | null]>;
}
