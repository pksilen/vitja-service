import { BackkEntity } from "../../types/entities/BackkEntity";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";
import { BackkError } from "../../types/BackkError";

export interface ErrorDef {
  errorCode: string;
  message: string;
  statusCode?: number;
}

export type PreHook<> =
  | {
      shouldExecutePreHook?: () => boolean | Promise<boolean> | PromiseOfErrorOr<boolean>;
      isSuccessfulOrTrue: () =>
        | PromiseOfErrorOr<BackkEntity | null>
        | Promise<boolean | BackkError | null | undefined>
        | boolean;
      error?: ErrorDef;
    }
  | (() =>
      | PromiseOfErrorOr<boolean | BackkEntity | null>
      | Promise<boolean | BackkError | null | undefined>
      | boolean);
