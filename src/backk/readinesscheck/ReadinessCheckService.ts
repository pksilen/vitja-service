import BaseService from "../service/basetypes/BaseService";
import { ErrorResponse } from "../types/ErrorResponse";

export default abstract class ReadinessCheckService extends BaseService {
  abstract isReady(): Promise<void | ErrorResponse>;
}
