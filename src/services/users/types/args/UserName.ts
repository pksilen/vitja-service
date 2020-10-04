// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { Matches, MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { Documentation } from '../../../../backk/annotations/type/Documentation';
import { IsExprTrue } from '../../../../backk/annotations/type/IsExprTrue';
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import DefaultPaymentMethod from "../entities/DefaultPaymentMethod";
import PaymentMethod from "../entities/PaymentMethod";

export default class UserName {
@MaxLength(512)
@IsExprTrue('password.length >= 8')
userName!: string;

}
