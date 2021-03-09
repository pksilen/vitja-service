import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";

export default class ChangeUserPasswordArg {
  _id!: string;

  @IsStrongPassword()
  currentPassword!: string;

  @IsStrongPassword()
  newPassword!: string;
}
