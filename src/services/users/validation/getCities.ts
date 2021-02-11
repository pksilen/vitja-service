import { Name } from '../../../backk/types/Name';
import { ErrorResponse } from '../../../backk/types/ErrorResponse';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../backk/errors/createErrorResponseFromErrorMessageAndStatusCode';
import { HttpStatusCodes } from '../../../backk/constants/constants';
import tryGetSeparatedValuesFromTextFile from '../../../backk/file/tryGetSeparatedValuesFromTextFile';
import tryGetValuesByXPathFromXmlFile from '../../../backk/file/tryGetValuesByXPathFromXmlFile';

export let cities: Name[] = [];

export default async function getCities(): Promise<Name[] | ErrorResponse> {
  if (cities.length === 0) {
    try {
      cities = tryGetValuesByXPathFromXmlFile(
        'resources/postitoimipaikat.xml',
        '/postitoimipaikat/toimipaikka/nimi/text()'
      ).map((cityNode) => ({ name: cityNode.nodeValue }));
    } catch (error) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        error.message,
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  return Promise.resolve(cities);
}
