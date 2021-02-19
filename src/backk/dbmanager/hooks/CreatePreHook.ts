import { Entity } from "../../types/entities/Entity";
import { SubEntity } from "../../types/entities/SubEntity";
import { ErrorResponse } from "../../types/ErrorResponse";
import { ErrorCodeAndMessageAndStatus } from "./PreHook";

export type CreatePreHook =
  | {
  shouldExecutePreHook?: () => boolean | Promise<boolean | ErrorResponse>;
  isSuccessfulOrTrue: (
  ) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean;
  errorMessage?: ErrorCodeAndMessageAndStatus;
  shouldDisregardFailureWhenExecutingTests?: boolean;
}
  | (() => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean);
