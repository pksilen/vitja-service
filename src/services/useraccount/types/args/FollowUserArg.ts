import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor";
import _IdAndVersionAndDefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/_IdAndVersionAndDefaultPostQueryOperations";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class FollowUserArg extends _IdAndVersionAndDefaultPostQueryOperations{
  @ShouldBeTrueFor<FollowUserArg>(
    ({ _id, followedUserAccountId }) => _id !== followedUserAccountId,
    '_id and followedUserAccountId may not be the same'
  )
  followedUserAccountId!: string;

  includeResponseFields: string[] = ['followedUsers']
}
