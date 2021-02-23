import { BackkEntity } from "../../types/entities/BackkEntity";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";

export type PostHook =
  | {
      shouldExecutePostHook: () => boolean;
      isSuccessful: () => PromiseOfErrorOr<BackkEntity | null>;
    }
  | (() => PromiseOfErrorOr<BackkEntity | null>);
