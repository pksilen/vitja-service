import { Injectable } from "@nestjs/common";
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import ReadinessCheckService from "./ReadinessCheckService";
import { AllowForEveryUser } from "../decorators/service/function/AllowForEveryUser";
import { ErrorResponse } from "../types/ErrorResponse";
import createErrorResponseFromErrorMessageAndStatusCode
  from "../errors/createErrorResponseFromErrorMessageAndStatusCode";
import initializeDatabase, { isDbInitialized } from "../dbmanager/sql/operations/ddl/initializeDatabase";
import { HttpStatusCodes } from "../constants/constants";
import { AllowForInternalUse } from "../decorators/service/function/AllowForInternalUse";

@Injectable()
export default class ReadinessCheckServiceImpl extends ReadinessCheckService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager, {});
  }

  @AllowForInternalUse()
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
