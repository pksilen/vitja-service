import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor";
import _IdAndVersionAndDefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/_IdAndVersionAndDefaultPostQueryOperations";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserAccountId extends _IdAndVersionAndDefaultPostQueryOperations{
  @ShouldBeTrueFor<_IdAndUserAccountId>(
    ({ _id, userAccountId }) => _id !== userAccountId,
    '_id and userAccountId may not be same'
  )
  userAccountId!: string;

  includeResponseFields = ['followedUsers']
}
