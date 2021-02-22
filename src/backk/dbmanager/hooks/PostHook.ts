import { BackkEntity } from "../../types/entities/BackkEntity";
import { BackkError } from "../../types/BackkError";

export type PostHook = {
  shouldExecutePostHook: () => boolean,
  isSuccessful: () => Promise<null | BackkEntity | BackkError>
} | (() => Promise<null | BackkEntity | BackkError>);

