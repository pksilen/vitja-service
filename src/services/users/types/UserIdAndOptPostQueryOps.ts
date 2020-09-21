import { OptPostQueryOps } from "../../../backk/Backk";
import { MaxLength } from "class-validator";

export default class UserIdAndOptPostQueryOps extends OptPostQueryOps {
  @MaxLength(24)
  userId!: string;
}
