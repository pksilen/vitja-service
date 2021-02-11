import { Name } from "../../../backk/types/Name";
import { ErrorResponse } from "../../../backk/types/ErrorResponse";
import createErrorResponseFromErrorMessageAndStatusCode
  from "../../../backk/errors/createErrorResponseFromErrorMessageAndStatusCode";
import { HttpStatusCodes } from "../../../backk/constants/constants";
import tryGetSeparatedValuesFromTextFile from "../../../backk/file/tryGetSeparatedValuesFromTextFile";

export let cities: Name[] = [];

export default async function getCities(): Promise<Name[] | ErrorResponse> {
  if (cities.length === 0) {
    try {
      cities = tryGetSeparatedValuesFromTextFile('resources/cities.txt').map((city) => ({ name: city }));
    } catch (error) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        error.message,
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  return Promise.resolve(cities);
}
