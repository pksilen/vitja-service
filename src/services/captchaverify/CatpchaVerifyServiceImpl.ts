import CaptchaVerifyService from "../../backk/captcha/CaptchaVerifyService";
import { Injectable } from "@nestjs/common";

@Injectable()
export default class CaptchaVerifierServiceImpl extends CaptchaVerifyService{
  verifyCaptcha(): Promise<boolean> {
   return Promise.resolve(true);
  }
}
