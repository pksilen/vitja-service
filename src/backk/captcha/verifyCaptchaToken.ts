import throwHttpException from "../throwHttpException";
import getBadRequestErrorResponse from "../getBadRequestErrorResponse";

export default async function verifyCaptchaToken(controller: any, captchaToken: string) {
  if (controller['captchaVerifyService']?.['verifyCaptcha']) {
    const isCaptchaVerified = await controller['captchaVerifyService']['verifyCaptcha'](captchaToken);
    if (!isCaptchaVerified) {
      throwHttpException(getBadRequestErrorResponse('Invalid captcha token'));
    }
  } else {
    throw new Error('captchaVerifierService is missing');
  }
}
