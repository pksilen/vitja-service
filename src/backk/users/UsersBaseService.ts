import UserResponse from "../../services/users/types/responses/UserResponse";
import { ErrorResponse } from "../types/ErrorResponse";
import _Id from "../types/id/_Id";
import CrudResourceService from "../service/crudresource/CrudResourceService";
import { AllowForServiceInternalUse } from "../decorators/service/function/AllowForServiceInternalUse";

export default class UsersBaseService extends CrudResourceService {
  isUsersService(): boolean {
    return true;
  }

  @AllowForServiceInternalUse()
  getUserById(id: _Id): Promise<UserResponse | ErrorResponse> {
    throw new Error('Not implemented')
  }
}
