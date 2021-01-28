import { Entity } from "../../types/entities/Entity";
import { ErrorResponse } from "../../types/ErrorResponse";

export type PostHook = {
  executePostHookIf: () => boolean,
  postHookFunc: () => Promise<void | Entity | ErrorResponse>
} | (() => Promise<void | Entity | ErrorResponse>);

