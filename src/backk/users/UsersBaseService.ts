import BaseService from '../service/basetypes/BaseService';
import UserResponse from "../../services/users/types/responses/UserResponse";
import { ErrorResponse } from "../types/ErrorResponse";
import Id from "../types/Id";

export default abstract class UsersBaseService extends BaseService {
  isUsersService(): boolean {
    return true;
  }

  abstract getUserById(id: Id): Promise<UserResponse | ErrorResponse>;
}
