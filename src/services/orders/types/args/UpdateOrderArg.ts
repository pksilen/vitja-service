// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsInt, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { ExpectInTestsToMatch } from '../../../../backk/ExpectInTestsToMatch';
import ShoppingCartItem from '../../../shoppingcart/types/entities/ShoppingCartItem';
import { Id } from '../../../../backk/Backk';

export default class UpdateOrderArg  {
@MaxLength(24)
_id!: string;

@MaxLength(24)
userId!: string;

shoppingCartItems!: ShoppingCartItem[];

}
