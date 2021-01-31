/* eslint-disable @typescript-eslint/class-name-casing */
import _Id from '../../../../backk/types/id/_Id';
import { IsExprTrue } from '../../../../backk/decorators/typeproperty/IsExprTrue';
import { CANNOT_FOLLOW_SELF } from '../../errors/usersServiceErrors';

export default class _IdAndFollowedUserId extends _Id {
  @IsExprTrue(({ _id, followedUserId }) => _id !== followedUserId, CANNOT_FOLLOW_SELF.errorMessage)
  followedUserId!: string;
}
