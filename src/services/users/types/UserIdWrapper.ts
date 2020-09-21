import { MaxLength } from "class-validator";

export default class UserIdWrapper {
  @MaxLength(24)
  userId!: string;
}
