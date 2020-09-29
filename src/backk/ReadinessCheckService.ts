import { ErrorResponse } from "./Backk";
import BaseService from "./BaseService";

export default abstract class ReadinessCheckService extends BaseService {
  abstract isReady(): Promise<void | ErrorResponse>;
}
