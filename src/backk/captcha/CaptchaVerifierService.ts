export default abstract class CaptchaVerifierService{
  abstract verifyCaptcha(captchaToken: string): Promise<boolean>;
}
