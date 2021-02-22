import UserAccountResponse from "../../../services/useraccounts/types/responses/UserResponse";
import { ErrorResponse } from "../../types/ErrorResponse";
import _Id from "../../types/id/_Id";
import CrudResourceService from "../crudresource/CrudResourceService";
import { AllowForServiceInternalUse } from "../../decorators/service/function/AllowForServiceInternalUse";

export default class UserAccountsBaseService extends CrudResourceService {
  isUsersService(): boolean {
    return true;
  }

  @AllowForServiceInternalUse()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserAccountById(id: _Id): Promise<UserAccountResponse | ErrorResponse> {
    throw new Error('Not implemented')
  }
}
