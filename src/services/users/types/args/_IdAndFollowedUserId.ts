/* eslint-disable @typescript-eslint/class-name-casing */
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
import _IdAndETag from "../../../../backk/types/id/_IdAndETag";

export default class _IdAndFollowedUserId extends _IdAndETag {
  @ShouldBeTrueForEntity(
    ({ _id, followedUserId }) => _id !== followedUserId,
    '_id and followedUserId may not be same'
  )
  followedUserId!: string;
}
