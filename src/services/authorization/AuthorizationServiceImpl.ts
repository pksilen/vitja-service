import AuthorizationService from "../../backk/authorization/AuthorizationService";

export default class AuthorizationServiceImpl extends AuthorizationService
{
  hasUserRoleIn(roles: string[], authHeader: string): Promise<boolean> {
    console.log(roles, authHeader);
    return Promise.resolve(true);
  }
}
