import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor";
import _IdAndDefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/_IdAndDefaultPostQueryOperations";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class UnfollowUserArg extends _IdAndDefaultPostQueryOperations{
  @ShouldBeTrueFor<UnfollowUserArg>(
    ({ _id, followedUserAccountId }) => _id !== followedUserAccountId,
    '_id and unfollowedUserAccountId may not be the same'
  )
  followedUserAccountId!: string;

  includeResponseFields: string[] = ['followedUsers']
}
