import { BackkError } from "../../types/BackkError";
import _Id from "../../types/id/_Id";
import CrudResourceService from "../crudresource/CrudResourceService";
import { AllowForServiceInternalUse } from "../../decorators/service/function/AllowForServiceInternalUse";
import BaseUserAccount from "../../types/useraccount/BaseUserAccount";

export default class UserAccountBaseService extends CrudResourceService {
  isUsersService(): boolean {
    return true;
  }

  @AllowForServiceInternalUse()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserAccountById(id: _Id): Promise<[BaseUserAccount, BackkError | null]> {
    throw new Error('Not implemented')
  }
}
