import BaseService from "../BaseService";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";

export default abstract class StartupCheckService extends BaseService {
  static controller: any | undefined;

  abstract isServiceStarted(): PromiseOfErrorOr<null>;
}
