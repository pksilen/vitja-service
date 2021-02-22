import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import GetUsersArg from "./types/args/GetUsersArg";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import User from "./types/entities/User";

export default abstract class UsersService extends CrudResourceService {
  abstract getUsers(arg: GetUsersArg): Promise<User[] | ErrorResponse>;
  abstract getUser(arg: _Id): Promise<User | ErrorResponse>;
}
