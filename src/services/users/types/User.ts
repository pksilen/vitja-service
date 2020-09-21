import UserCreateDto from './UserCreateDto';
import Entity from "../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class User extends UserCreateDto {
  @MaxLength(24)
  _id!: string;
}
