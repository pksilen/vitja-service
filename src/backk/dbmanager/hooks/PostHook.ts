import { BackkEntity } from "../../types/entities/BackkEntity";
import { ErrorResponse } from "../../types/ErrorResponse";

export type PostHook = {
  shouldExecutePostHook: () => boolean,
  isSuccessful: () => Promise<void | BackkEntity | ErrorResponse>
} | (() => Promise<void | BackkEntity | ErrorResponse>);

