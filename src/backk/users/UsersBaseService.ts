import UserResponse from "../../services/users/types/responses/UserResponse";
import { ErrorResponse } from "../types/ErrorResponse";
import _Id from "../types/id/_Id";
import CrudResourceService from "../crudresource/CrudResourceService";

export default abstract class UsersBaseService extends CrudResourceService {
  isUsersService(): boolean {
    return true;
  }

  abstract getUserById(id: _Id): Promise<UserResponse | ErrorResponse>;
}
