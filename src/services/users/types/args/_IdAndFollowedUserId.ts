/* eslint-disable @typescript-eslint/class-name-casing */
import _Id from "../../../../backk/types/id/_Id";
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";

export default class _IdAndFollowedUserId extends _Id {
  @ShouldBeTrueForEntity(({ _id, followedUserId }) => _id !== followedUserId, '_id and followedUserId may not be same')
  followedUserId!: string;
}
