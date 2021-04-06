import { BackkEntity } from "../../types/entities/BackkEntity";
import { PromiseErrorOr } from "../../types/PromiseErrorOr";
import { SubEntity } from "../../types/entities/SubEntity";
import { ErrorDef } from "./PreHook";

export type PostHook<T extends BackkEntity | SubEntity> =
  | {
      executePostHookIf?: (entity: T | null) => boolean;
      shouldSucceed?: (entity: T | null) => PromiseErrorOr<BackkEntity | null>
      shouldBeTrue?: (entity: T | null) => Promise<boolean> | boolean;
      error?:  ErrorDef
    }
  | ((entity: T | null) => PromiseErrorOr<BackkEntity | null> | Promise<boolean> | boolean);
