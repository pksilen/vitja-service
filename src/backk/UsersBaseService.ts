import BaseService from './BaseService';
import { ErrorResponse, Id } from "./Backk";
import UserResponse from "../services/users/types/responses/UserResponse";

export default abstract class UsersBaseService extends BaseService {
  isUsersService(): boolean {
    return true;
  }

  abstract getUserById(id: Id): Promise<UserResponse | ErrorResponse>;
}
