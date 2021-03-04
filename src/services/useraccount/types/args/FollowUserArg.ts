import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor";
import _Id from "../../../../backk/types/id/_Id";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class FollowUserArg extends _Id{
  @ShouldBeTrueFor<FollowUserArg>(
    ({ _id, followedUserAccountId }) => _id !== followedUserAccountId,
    '_id and followedUserAccountId may not be the same'
  )
  followedUserAccountId!: string;
}
