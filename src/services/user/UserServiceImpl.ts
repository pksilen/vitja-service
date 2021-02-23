import { Injectable } from "@nestjs/common";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import _Id from "../../backk/types/id/_Id";
import GetUsersArg from ".//types/args/GetUsersArg";
import SqlExpression from "../../backk/dbmanager/sql/expressions/SqlExpression";
import User from "./types/entities/User";
import UserService from "./UserService";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserServiceImpl extends UserService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForEveryUser()
  getUsers({ displayNameFilter, ...postQueryOperations }: GetUsersArg): PromiseOfErrorOr<User[]> {
    const filters = this.dbManager.getFilters<User>(
      {
        displayName: new RegExp(displayNameFilter)
      },
      [
        new SqlExpression('displayname LIKE :displayNameFilter', {
          displayNameFilter: `%${displayNameFilter}%`
        })
      ]
    );

    return this.dbManager.getEntitiesByFilters(filters, User, {
      ...postQueryOperations,
      includeResponseFields: ['_id', 'displayName', 'city', 'imageDataUri']
    });
  }

  @AllowForEveryUser()
  getUser({ _id }: _Id): PromiseOfErrorOr<User> {
    return this.dbManager.getEntityById(_id, User);
  }
}
