import { OptionalPostQueryOperations } from "../../../backk/Backk";
import { MaxLength } from "class-validator";

export default class UserIdAndOptionalPostQueryOperations extends OptionalPostQueryOperations {
  @MaxLength(24)
  userId!: string;
}
