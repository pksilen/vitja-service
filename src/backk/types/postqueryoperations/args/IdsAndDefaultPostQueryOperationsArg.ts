import { IsArray, IsString, MaxLength } from 'class-validator';
import DefaultPostQueryOperationsArg from './DefaultPostQueryOperationsArg';

export default class IdsAndDefaultPostQueryOperationsArg extends DefaultPostQueryOperationsArg {
  @IsString({ each: true })
  // TODO replace with MaxLengthAndMacthes annotation
  @MaxLength(24, { each: true })
  @IsArray()
  _ids!: string[];
}
