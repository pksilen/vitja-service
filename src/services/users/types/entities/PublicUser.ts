// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { Lengths } from '../../../../backk/constants/constants';
import Entity from '../../../../backk/decorators/entity/Entity';
import IsAnyString from '../../../../backk/decorators/typeproperty/IsAnyString';
import IsDataUri from '../../../../backk/decorators/typeproperty/IsDataUri';
import IsOneOf from '../../../../backk/decorators/typeproperty/IsOneOf';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import getCities from '../../validation/getCities';

@Entity('User')
export default class PublicUser {
  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsStringOrObjectId({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, {
    groups: ['__backk_update__']
  })
  public _id!: string;

  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @MaxLength(Lengths._256)
  @IsOneOf(getCities, 'usersService.getCities', 'Tampere')
  public city!: string;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public imageDataUri!: string;
}
