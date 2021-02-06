import { Name } from '../../../backk/types/Name';
import { ErrorResponse } from '../../../backk/types/ErrorResponse';
import { readFileSync } from 'fs';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../backk/errors/createErrorResponseFromErrorMessageAndStatusCode';
import { HttpStatusCodes } from '../../../backk/constants/constants';

export let cities: Name[] = [];

export default async function getCities(): Promise<Name[] | ErrorResponse> {
  if (cities.length === 0) {
    try {
      const citiesFileContent = readFileSync('resources/cities.txt', { encoding: 'UTF-8' });
      cities = citiesFileContent.split('\n').filter(city => city).map((city) => ({ name: city }));
    } catch (error) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        error.message,
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  return Promise.resolve(cities);
}
