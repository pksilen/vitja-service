import UserWithoutId from './UserWithoutId';
import Entity from "../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class User extends UserWithoutId {
  @MaxLength(24)
  _id!: string;
}
