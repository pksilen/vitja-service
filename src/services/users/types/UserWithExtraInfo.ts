import User from "./User";
import { ExpectTestValueOfType } from "../../../backk/ExpectTestValueOfType";

export default class UserWithExtraInfo extends User {
  @ExpectTestValueOfType('string')
  extraInfo!: string;
}
