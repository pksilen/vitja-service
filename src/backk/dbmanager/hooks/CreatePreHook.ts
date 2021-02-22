import { BackkEntity } from "../../types/entities/BackkEntity";
import { BackkError } from "../../types/BackkError";
import { ErrorCodeAndMessageAndStatus } from "./PreHook";

export type CreatePreHook =
  | {
  shouldExecutePreHook?: () => boolean | Promise<[boolean, BackkError | null]>;
  isSuccessfulOrTrue: (
  ) => Promise<boolean | null | BackkEntity | BackkError> | boolean;
  errorMessage?: ErrorCodeAndMessageAndStatus;
  shouldDisregardFailureWhenExecutingTests?: boolean;
}
  | (() => Promise<boolean | null | BackkEntity | BackkError> | boolean);
