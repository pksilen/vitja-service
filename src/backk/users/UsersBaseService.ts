import BaseService from '../service/BaseService';
import UserResponse from "../../services/users/types/responses/UserResponse";
import { ErrorResponse } from "../types/ErrorResponse";
import _Id from "../types/id/_Id";

export default abstract class UsersBaseService extends BaseService {
  isUsersService(): boolean {
    return true;
  }

  abstract getUserById(id: _Id): Promise<UserResponse | ErrorResponse>;
}
