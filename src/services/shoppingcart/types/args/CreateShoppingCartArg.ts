// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize } from 'class-validator';
import ShoppingCartItem from '../entities/ShoppingCartItem';

export default class CreateShoppingCartArg {
  userId!: string;

  @ArrayMaxSize(50)
  shoppingCartItems!: ShoppingCartItem[];
}
