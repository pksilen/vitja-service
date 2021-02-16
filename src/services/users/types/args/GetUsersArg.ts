import DefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/DefaultPostQueryOperations";
import { MaxLength } from "class-validator";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";

export default class GetUsersArg extends DefaultPostQueryOperations {
  @MaxLength(256)
  @IsAnyString()
  userNameOrDisplayNameFilter!: string;
}
