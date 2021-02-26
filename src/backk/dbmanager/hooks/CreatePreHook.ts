import { BackkEntity } from "../../types/entities/BackkEntity";
import { ErrorCodeAndMessageAndStatus } from "./PreHook";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";
import { BackkError } from "../../types/BackkError";

export type CreatePreHook =
  | {
      shouldExecutePreHook?: () => boolean | PromiseOfErrorOr<boolean>;
      isSuccessfulOrTrue: () => PromiseOfErrorOr<BackkEntity | null> | Promise<boolean | BackkError | null | undefined> | boolean;
      errorMessage?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | (() => PromiseOfErrorOr<BackkEntity | null> | Promise<boolean | BackkError | null | undefined> | boolean);
