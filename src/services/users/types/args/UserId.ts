import { MaxLength } from "class-validator";

export default class UserId {
  @MaxLength(24)
  userId!: string;
}
