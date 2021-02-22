import { BackkError } from "../../types/BackkError";
import { BackkEntity } from "../../types/entities/BackkEntity";
import { SubEntity } from "../../types/entities/SubEntity";

export interface ErrorCodeAndMessageAndStatus {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export type PreHook<T extends BackkEntity | SubEntity> =
  | {
      shouldExecutePreHook?: (entity: T) => boolean | Promise<[boolean, BackkError | null]>;
      isSuccessfulOrTrue: (
        entity: T
      ) => Promise<[BackkEntity,  BackkError | null]> | boolean;
      errorMessage?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((entity: T) => Promise<[BackkEntity,  BackkError | null]> | boolean;
