/* eslint-disable @typescript-eslint/class-name-casing */
import _Id from "../../../../backk/types/id/_Id";
import { IsExprTrue } from "../../../../backk/decorators/typeproperty/IsExprTrue";

export default class _IdAndFollowedUserId extends _Id {
  @IsExprTrue(({ _id, followedUserId }) => _id !== followedUserId, '_id and followedUserId may not be same')
  followedUserId!: string;
}
