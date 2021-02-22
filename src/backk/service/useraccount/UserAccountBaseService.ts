import { ErrorResponse } from "../../types/ErrorResponse";
import _Id from "../../types/id/_Id";
import CrudResourceService from "../crudresource/CrudResourceService";
import { AllowForServiceInternalUse } from "../../decorators/service/function/AllowForServiceInternalUse";
import UserAccountResponse from "../../../services/useraccount/types/responses/UserAccountResponse";

export default class UserAccountBaseService extends CrudResourceService {
  isUsersService(): boolean {
    return true;
  }

  @AllowForServiceInternalUse()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserAccountById(id: _Id): Promise<UserAccountResponse | ErrorResponse> {
    throw new Error('Not implemented')
  }
}
