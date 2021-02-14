/* eslint-disable @typescript-eslint/class-name-casing */
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion";

export default class _IdAndFollowedUserId extends _IdAndVersion {
  @ShouldBeTrueForEntity(
    ({ _id, followedUserId }) => _id !== followedUserId,
    '_id and followedUserId may not be same'
  )
  followedUserId!: string;
}
