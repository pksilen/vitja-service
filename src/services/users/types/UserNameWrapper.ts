import { MaxLength } from "class-validator";

export default class UserNameWrapper {
  @MaxLength(512)
  userName!: string;
}
