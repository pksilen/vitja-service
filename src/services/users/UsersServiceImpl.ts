import { Injectable } from "@nestjs/common";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import _Id from "../../backk/types/id/_Id";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import GetUsersArg from "../users/types/args/GetUsersArg";
import SqlExpression from "../../backk/dbmanager/sql/expressions/SqlExpression";
import UsersService from "./UsersService";
import User from "./types/entities/User";


@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForEveryUser()
  getUsers({
             displayNameFilter,
             ...postQueryOperations
           }: GetUsersArg): Promise<User[] | ErrorResponse> {
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

    return this.dbManager.getEntitiesByFilters(filters, User, postQueryOperations);
  }

  @AllowForSelf()
  async getUser({ _id }: _Id): Promise<User | ErrorResponse> {
    return this.dbManager.getEntityById(_id, User);
  }
}
