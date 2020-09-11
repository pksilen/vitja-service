import { ErrorResponse } from "../../backk/Backk";

export default abstract class ReadinessCheckService {
  abstract isReady(): Promise<void | ErrorResponse>;
}
