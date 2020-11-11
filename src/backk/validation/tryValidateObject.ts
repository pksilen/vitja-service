import { validateOrReject } from "class-validator";
import createErrorFromErrorMessageAndThrowError from "../errors/createErrorFromErrorMessageAndThrowError";
import createErrorMessageWithStatusCode from "../errors/createErrorMessageWithStatusCode";
import getValidationErrors from "./getValidationErrors";

export default async function tryValidateObject(obj: object): Promise<void> {
  try {
    await validateOrReject(obj, {
      groups: ['__backk_firstRound__']
    });

    await validateOrReject(obj, {
      whitelist: true,
      forbidNonWhitelisted: true
    });
  } catch (validationErrors) {
    const errorMessage = 'Error code invalidArgument: Invalid argument: ' + getValidationErrors(validationErrors);
    createErrorFromErrorMessageAndThrowError(createErrorMessageWithStatusCode(errorMessage, 400));
  }
}
