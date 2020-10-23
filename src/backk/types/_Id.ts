import { IsString, MaxLength } from 'class-validator';

export default class _Id {
  @IsString()
  @MaxLength(24)
  _id!: string;
}
