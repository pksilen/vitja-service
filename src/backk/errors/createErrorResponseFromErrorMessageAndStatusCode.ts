import createErrorMessageWithStatusCode from "./createErrorMessageWithStatusCode";
import createErrorResponseFromError from "./createErrorResponseFromError";

export default function createErrorResponseFromErrorMessageAndStatusCode(errorMessage: string, statusCode: number) {
  const finalErrorMessage = createErrorMessageWithStatusCode(errorMessage, statusCode);
  return createErrorResponseFromError(new Error(finalErrorMessage));
}
