import { Injectable } from "@nestjs/common";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import ReadinessCheckService from "../../backk/readinesscheck/ReadinessCheckService";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import createErrorResponseFromErrorMessageAndStatusCode
  from "../../backk/errors/createErrorResponseFromErrorMessageAndStatusCode";
import initializeDatabase, { isDbInitialized } from "../../backk/dbmanager/sql/operations/ddl/initializeDatabase";
import { HttpStatusCodes } from "../../backk/constants/constants";

@Injectable()
export default class ReadinessCheckServiceImpl extends ReadinessCheckService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager, {});
  }

  @AllowForEveryUser()
  async isReady(): Promise<void | ErrorResponse> {
    if (!isDbInitialized(this.dbManager) && !(await initializeDatabase(this.dbManager))) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Database not ready',
        HttpStatusCodes.SERVICE_UNAVAILABLE
      );
    }

    return;
  }
}
