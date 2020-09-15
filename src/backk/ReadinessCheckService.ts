import { ErrorResponse } from "./Backk";

export default abstract class ReadinessCheckService {
  abstract isReady(): Promise<void | ErrorResponse>;
}
