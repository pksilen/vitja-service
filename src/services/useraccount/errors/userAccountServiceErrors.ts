export const userAccountServiceErrors = {
  invalidCurrentPassword: {
    errorCode: 'userAccountService.1',
    message: 'Invalid current password'
  },
  invalidUserName: {
    errorCode: 'userAccountService.2',
    message: 'Invalid user name'
  },
  newPasswordCannotBeSameAsCurrentPassword: {
    errorCode: 'userAccountService.3',
    message: 'New password cannot be same as current password'
  },
  newPasswordAndRepeatNewPasswordDoNotMatch: {
    errorCode: 'userAccountService.4',
    message: 'Given new password and repeated new password do not match'
  }
};
