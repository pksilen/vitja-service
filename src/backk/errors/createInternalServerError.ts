import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";
import { HttpStatusCodes } from '../constants/constants';

export default function createInternalServerError(errorMessage: string): ErrorResponse {
  return {
    errorMessage,
    [errorResponseSymbol]: true,
    statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR
  };
}
