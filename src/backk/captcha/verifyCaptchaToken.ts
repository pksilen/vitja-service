import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';

export default async function verifyCaptchaToken(controller: any, captchaToken: string) {
  if (controller['captchaVerifyService']?.['verifyCaptcha']) {
    const isCaptchaVerified = await controller['captchaVerifyService']['verifyCaptcha'](captchaToken);
    if (!isCaptchaVerified) {
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode('Invalid captcha token', 404)
      );
    }
  } else {
    throw new Error('captchaVerifierService is missing');
  }
}
