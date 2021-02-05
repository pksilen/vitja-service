// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../backk/decorators/entity/Entity";
import _Id from "../../../backk/types/id/_Id";
import { MaxLength } from "class-validator";
import IsAnyString from "../../../backk/decorators/typeproperty/IsAnyString";
import { Unique } from "../../../backk/decorators/typeproperty/Unique";
import MaxLengthAndMatches from "../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import { Entity } from "../../../backk/types/entities/Entity";
import IsUndefined from "../../../backk/decorators/typeproperty/IsUndefined";
import IsStringOrObjectId from "../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing


export default class TagName {
  @MaxLength(64)
  @IsAnyString()
  @Unique()
  public name!: string;

}