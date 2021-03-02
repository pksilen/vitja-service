import BaseService from "./BaseService";
import { PromiseOfErrorOr } from "../types/PromiseOfErrorOr";

export default abstract class ReadinessCheckService extends BaseService {
  abstract isServiceReady(): PromiseOfErrorOr<null>;
}
