import { ErrorResponse } from "../../types/ErrorResponse";
import { BackkEntity } from "../../types/entities/BackkEntity";
import { SubEntity } from "../../types/entities/SubEntity";

export interface ErrorCodeAndMessageAndStatus {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export type PreHook<T extends BackkEntity | SubEntity> =
  | {
      shouldExecutePreHook?: (entity: T) => boolean | Promise<boolean | ErrorResponse>;
      isSuccessfulOrTrue: (
        entity: T
      ) => Promise<boolean | undefined | void | BackkEntity | ErrorResponse> | boolean;
      errorMessage?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((entity: T) => Promise<boolean | undefined | void | BackkEntity | ErrorResponse> | boolean);
