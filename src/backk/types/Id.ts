import { IsString, MaxLength } from 'class-validator';

export default class Id {
  @IsString()
  @MaxLength(24)
  _id!: string;
}
