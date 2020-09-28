export default abstract class AuthorizationService {
  abstract hasUserRoleIn(roles: string[], authHeader: string): Promise<boolean>;
  abstract areSameIdentities(
    userIdType: 'userName' | 'userId',
    userId: string,
    authHeader: string
  ): Promise<boolean>;
}
