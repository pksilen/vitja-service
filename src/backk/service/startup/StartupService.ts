import BaseService from "../BaseService";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";

export default abstract class StartupService extends BaseService {
  static controller: any | undefined;

  abstract isServiceStarted(): PromiseOfErrorOr<null>;
}
