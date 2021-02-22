import DefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/DefaultPostQueryOperations";
import { MaxLength } from "class-validator";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import { Lengths } from "../../../../backk/constants/constants";

export default class GetUsersArg extends DefaultPostQueryOperations {
  @MaxLength(Lengths._256)
  @IsAnyString()
  displayNameFilter!: string;
}
