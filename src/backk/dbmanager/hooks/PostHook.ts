import { BackkEntity } from "../../types/entities/BackkEntity";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";
import { SubEntity } from "../../types/entities/SubEntity";
import { ErrorDef } from "./PreHook";

export type PostHook<T extends BackkEntity | SubEntity> =
  | {
      shouldExecutePostHook?: (entity: T | null) => boolean;
      isSuccessfulOrTrue: (entity: T | null) => PromiseOfErrorOr<BackkEntity | null> | Promise<boolean> | boolean;
      error?:  ErrorDef
    }
  | ((entity: T | null) => PromiseOfErrorOr<BackkEntity | null> | Promise<boolean> | boolean);
