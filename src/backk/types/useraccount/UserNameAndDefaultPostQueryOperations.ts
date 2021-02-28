import DefaultPostQueryOperations from "../postqueryoperations/DefaultPostQueryOperations";
import { IsEmail } from "class-validator";

export default class UserNameAndDefaultPostQueryOperations extends DefaultPostQueryOperations {
  @IsEmail()
  userName!: string;
}
