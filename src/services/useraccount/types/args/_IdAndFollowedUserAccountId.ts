import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor";
import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndFollowedUserAccountId extends _IdAndVersion {
  @ShouldBeTrueFor<_IdAndFollowedUserAccountId>(
    ({ _id, followedUserAccountId }) => _id !== followedUserAccountId,
    '_id and followedUserAccountId may not be same'
  )
  followedUserAccountId!: string;
}
