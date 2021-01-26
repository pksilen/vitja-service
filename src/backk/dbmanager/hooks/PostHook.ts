import { Entity } from "../../types/entities/Entity";
import { ErrorResponse } from "../../types/ErrorResponse";

export interface PostHook {
  expectSuccess: () => Promise<void | Entity | ErrorResponse>;
}
