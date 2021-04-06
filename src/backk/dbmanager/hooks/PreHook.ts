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
        | PromiseErrorOr<BackkEntity[] | BackkEntity | null>
        | Promise<boolean | BackkError | null | undefined | void>
        | boolean;
      error?: ErrorDef;
    }
  | (() =>
      | PromiseErrorOr<boolean | BackkEntity[] | BackkEntity | null>
      | Promise<boolean | BackkError | null | undefined | void>
      | boolean);
