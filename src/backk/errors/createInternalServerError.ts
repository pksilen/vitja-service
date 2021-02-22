import { BackkError, errorResponseSymbol } from "../types/BackkError";
import { HttpStatusCodes } from '../constants/constants';

export default function createInternalServerError(errorMessage: string): BackkError {
  return {
    errorMessage,
    [errorResponseSymbol]: true,
    statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR
  };
}
