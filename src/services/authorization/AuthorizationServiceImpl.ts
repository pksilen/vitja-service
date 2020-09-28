import AuthorizationService from '../../backk/authorization/AuthorizationService';
import UsersService from "../users/UsersService";

export default class AuthorizationServiceImpl extends AuthorizationService {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  hasUserRoleIn(roles: string[], authHeader: string): Promise<boolean> {
    console.log(roles, authHeader);
    return Promise.resolve(true);
  }

  areSameIdentities(userIdType: 'userName' | 'userId', userId: string, authHeader: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
