export const userAccountServiceErrors = {
  invalidCurrentPasswordError: {
    errorCode: 'userAccountService.1',
    message: 'Invalid current password'
  },
  invalidUserNameError: {
    errorCode: 'userAccountService.2',
    message: 'Invalid user name'
  },
  newPasswordCannotBeSameAsCurrentPasswordError: {
    errorCode: 'userAccountService.3',
    message: 'New password cannot be same as current password'
  },
  newPasswordAndRepeatNewPasswordDoNotMatchError: {
    errorCode: 'userAccountService.4',
    message: 'Given new password and repeated new password do not match'
  }
};
