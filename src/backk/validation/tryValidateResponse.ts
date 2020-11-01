import { validateOrReject } from "class-validator";
import createErrorFromErrorMessageAndThrowError from "../errors/createErrorFromErrorMessageAndThrowError";
import createErrorMessageWithStatusCode from "../errors/createErrorMessageWithStatusCode";
import { plainToClass } from "class-transformer";
import getValidationErrors from "./getValidationErrors";

export default async function tryValidateResponse(response: object, ReturnType: new() => any) {
  const instantiatedResponse = plainToClass(ReturnType, response);
  try {
    await validateOrReject(instantiatedResponse, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true
    });
  } catch (validationErrors) {
    const errorMessage = 'Invalid response: ' + getValidationErrors(validationErrors);
    createErrorFromErrorMessageAndThrowError(createErrorMessageWithStatusCode(errorMessage, 400));
  }
}
