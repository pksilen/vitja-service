import { OptPostQueryOps } from "../../../../backk/Backk";
import { MaxLength } from "class-validator";

export default class GetByUserIdArg extends OptPostQueryOps {
  @MaxLength(24)
  userId!: string;
}
