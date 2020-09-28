export default abstract class AuthorizationService{
  abstract hasUserRoleIn(roles: string[], authHeader: string): Promise<boolean>;
}
