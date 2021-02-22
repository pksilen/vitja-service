import BaseService from "../BaseService";
import { BackkError } from "../../types/BackkError";

export default abstract class StartupService extends BaseService {
  static controller: any | undefined;

  abstract initializeService(): Promise<BackkError | null>;
}
