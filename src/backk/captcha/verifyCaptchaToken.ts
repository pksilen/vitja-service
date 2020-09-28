import throwHttpException from '../throwHttpException';
import { HttpStatus } from '@nestjs/common';

export default async function verifyCaptchaToken(controller: any, captchaToken: string) {
  if (controller['captchaVerifyService']?.['verifyCaptcha']) {
    const isCaptchaVerified = await controller['captchaVerifyService']['verifyCaptcha'](captchaToken);
    if (!isCaptchaVerified) {
      throwHttpException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: 'Invalid captcha token'
      });
    }
  } else {
    throw new Error('captchaVerifierService is missing');
  }
}
