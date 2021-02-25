import { BackkEntity } from "../../types/entities/BackkEntity";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";
import { SubEntity } from "../../types/entities/SubEntity";

export type PostHook<T extends BackkEntity | SubEntity> =
  | {
      shouldExecutePostHook: () => boolean;
      isSuccessful: (entity: T | null) => PromiseOfErrorOr<BackkEntity | null>;
    }
  | ((entity: T | null) => PromiseOfErrorOr<BackkEntity | null>);
