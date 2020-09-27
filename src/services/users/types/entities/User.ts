import Entity from "../../../../backk/annotations/entity/Entity";
import { MaxLength } from "class-validator";
import UserWithoutId from "../base/UserWithoutId";

@Entity()
export default class User extends UserWithoutId {
  @MaxLength(24)
  _id!: string;
}
