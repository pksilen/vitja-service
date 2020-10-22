import { IsArray, IsString, MaxLength } from "class-validator";
import OptPostQueryOps from "./OptPostQueryOps";

export default class IdsAndOptPostQueryOps extends OptPostQueryOps {
  @IsString({ each: true })
  @MaxLength(24, { each: true })
  @IsArray()
  _ids!: string[];
}
