import { ErrorResponse } from "../../types/ErrorResponse";
import { Entity } from "../../types/entities/Entity";
import { SubEntity } from "../../types/entities/SubEntity";

export interface ErrorCodeAndMessageAndStatus {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export type PreHook<T extends Entity | SubEntity> =
  | {
      shouldExecutePreHook?: (entity: T) => boolean | Promise<boolean | ErrorResponse>;
      isSuccessfulOrTrue: (
        entity: T
      ) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean;
      errorMessage?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((entity: T) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean);
