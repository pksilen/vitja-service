import { MaxLength } from "class-validator";

export default class UserName {
  @MaxLength(512)
  userName!: string;
}
