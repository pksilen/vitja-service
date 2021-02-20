import { BackkEntity } from "../../types/entities/BackkEntity";
import { SubEntity } from "../../types/entities/SubEntity";
import { ErrorResponse } from "../../types/ErrorResponse";
import { ErrorCodeAndMessageAndStatus } from "./PreHook";

export type CreatePreHook =
  | {
  shouldExecutePreHook?: () => boolean | Promise<boolean | ErrorResponse>;
  isSuccessfulOrTrue: (
  ) => Promise<boolean | undefined | void | BackkEntity | ErrorResponse> | boolean;
  errorMessage?: ErrorCodeAndMessageAndStatus;
  shouldDisregardFailureWhenExecutingTests?: boolean;
}
  | (() => Promise<boolean | undefined | void | BackkEntity | ErrorResponse> | boolean);
