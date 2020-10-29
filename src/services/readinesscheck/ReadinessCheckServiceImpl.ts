import { Injectable } from "@nestjs/common";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import ReadinessCheckService from "../../backk/readinesscheck/ReadinessCheckService";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import createErrorResponseFromErrorMessageAndStatusCode from "../../backk/errors/createErrorResponseFromErrorMessageAndStatusCode";

@Injectable()
export default class ReadinessCheckServiceImpl extends ReadinessCheckService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager, {});
  }

  @AllowForEveryUser()
  async isReady(): Promise<void | ErrorResponse> {
    const isDbReady = await this.dbManager.isDbReady();
    if (isDbReady) {
      return;
    }

    return Promise.resolve(createErrorResponseFromErrorMessageAndStatusCode('Database not ready', 503));
  }
}
