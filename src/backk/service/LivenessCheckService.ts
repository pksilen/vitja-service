import BaseService from "./BaseService";
import { PromiseOfErrorOr } from "../types/PromiseOfErrorOr";

export default abstract class LivenessCheckService extends BaseService {
  abstract isServiceAlive(): PromiseOfErrorOr<null>;
}
