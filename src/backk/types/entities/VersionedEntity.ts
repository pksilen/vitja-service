import { Entity } from "./Entity";

export interface VersionedEntity extends Entity {
  version: string;
}
