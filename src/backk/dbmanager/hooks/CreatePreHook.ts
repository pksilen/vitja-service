import { BackkEntity } from "../../types/entities/BackkEntity";
import { ErrorCodeAndMessageAndStatus } from "./PreHook";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";

export type CreatePreHook =
  | {
      shouldExecutePreHook?: () => boolean | PromiseOfErrorOr<boolean>;
      isSuccessfulOrTrue: () => PromiseOfErrorOr<boolean | BackkEntity | null> | Promise<boolean> | boolean;
      errorMessage?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | (() => PromiseOfErrorOr<boolean | BackkEntity> | Promise<boolean> | boolean);
