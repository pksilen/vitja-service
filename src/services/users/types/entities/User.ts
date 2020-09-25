import CreateUserArg from '../args/CreateUserArg';
import Entity from "../../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class User extends CreateUserArg {
  @MaxLength(24)
  _id!: string;
}
