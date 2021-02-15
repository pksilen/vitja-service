import BaseService from "../BaseService";
import { ErrorResponse } from "../../types/ErrorResponse";

export default abstract class StartupService extends BaseService {
  static controller: any | undefined;

  abstract initializeService(): Promise<void | ErrorResponse>;
}
