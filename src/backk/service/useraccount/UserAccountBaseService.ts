import _Id from "../../types/id/_Id";
import CrudResourceService from "../crudresource/CrudResourceService";
import { AllowForServiceInternalUse } from "../../decorators/service/function/AllowForServiceInternalUse";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";
import UserName from "../../types/useraccount/UserName";

export default class UserAccountBaseService extends CrudResourceService {
  isUsersService(): boolean {
    return true;
  }

  @AllowForServiceInternalUse()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserNameById(id: _Id): PromiseOfErrorOr<UserName> {
    throw new Error('Not implemented')
  }
}
