import { Name } from "../../../backk/types/Name";
import { ErrorResponse } from "../../../backk/types/ErrorResponse";
import createErrorResponseFromErrorMessageAndStatusCode
  from "../../../backk/errors/createErrorResponseFromErrorMessageAndStatusCode";
import { HttpStatusCodes } from "../../../backk/constants/constants";
import tryGetSeparatedValuesFromFile from "../../../backk/file/tryGetSeparatedValuesFromFile";

export let cities: Name[] = [];

export default async function getCities(): Promise<Name[] | ErrorResponse> {
  if (cities.length === 0) {
    try {
      cities = tryGetSeparatedValuesFromFile('resource/cities.txt').map((city) => ({ name: city }));
    } catch (error) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        error.message,
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  return Promise.resolve(cities);
}
