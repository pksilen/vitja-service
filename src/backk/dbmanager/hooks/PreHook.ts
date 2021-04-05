import { BackkEntity } from "../../types/entities/BackkEntity";
import { PromiseErrorOr } from "../../types/PromiseErrorOr";
import { BackkError } from "../../types/BackkError";

export interface ErrorDef {
  errorCode: string;
  message: string;
  statusCode?: number;
}

export type PreHook<> =
  | {
      shouldExecutePreHook?: () => boolean | Promise<boolean> | PromiseErrorOr<boolean>;
      isSuccessfulOrTrue: () =>
        | PromiseErrorOr<BackkEntity | null>
        | Promise<boolean | BackkError | null | undefined>
        | boolean;
      error?: ErrorDef;
    }
  | (() =>
      | PromiseErrorOr<boolean | BackkEntity | null>
      | Promise<boolean | BackkError | null | undefined>
      | boolean);
