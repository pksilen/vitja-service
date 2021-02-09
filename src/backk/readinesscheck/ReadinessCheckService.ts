import BaseService from "../service/BaseService";
import { ErrorResponse } from "../types/ErrorResponse";

export default abstract class ReadinessCheckService extends BaseService {
  static controller: any | undefined;

  abstract isReady(): Promise<void | ErrorResponse>;
}
