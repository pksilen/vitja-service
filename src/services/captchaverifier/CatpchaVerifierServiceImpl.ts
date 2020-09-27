import CaptchaVerifierService from "../../backk/captcha/CaptchaVerifierService";
import { Injectable } from "@nestjs/common";

@Injectable()
export default class CaptchaVerifierServiceImpl extends CaptchaVerifierService{
  verifyCaptcha(): Promise<boolean> {
   return Promise.resolve(true);
  }
}
