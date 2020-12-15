import { ErrorResponse } from "../../backk/types/ErrorResponse";
import BaseService from "../../backk/service/BaseService";

export default abstract class DbCleanupService extends BaseService {
  abstract deleteOldUnsoldSalesItems(): Promise<void | ErrorResponse>;
}
