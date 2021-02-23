import createErrorMessageWithStatusCode from "./createErrorMessageWithStatusCode";
import createBackkErrorFromError from "./createBackkErrorFromError";

export default function createErrorResponseFromErrorMessageAndStatusCode(errorMessage: string, statusCode: number) {
  const finalErrorMessage = createErrorMessageWithStatusCode(errorMessage, statusCode);
  return createBackkErrorFromError(new Error(finalErrorMessage));
}
