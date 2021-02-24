import { Name } from "../../../backk/types/Name";
import createBackkErrorFromErrorMessageAndStatusCode
  from "../../../backk/errors/createBackkErrorFromErrorMessageAndStatusCode";
import { HttpStatusCodes } from "../../../backk/constants/constants";
import tryGetValuesByXPathFromXmlFile from "../../../backk/file/tryGetValuesByXPathFromXmlFile";
import { PromiseOfErrorOr } from "../../../backk/types/PromiseOfErrorOr";

let cities: Name[] = [];

export default function getCities(): PromiseOfErrorOr<Name[]> {
  if (cities.length === 0) {
    try {
      cities = tryGetValuesByXPathFromXmlFile(
        'resources/postitoimipaikat.xml',
        '/postitoimipaikat/toimipaikka/nimi/text()'
      ).map((cityNode) => ({ name: cityNode.nodeValue }));
    } catch (error) {
      return Promise.resolve([
        null,
        createBackkErrorFromErrorMessageAndStatusCode(error.message, HttpStatusCodes.INTERNAL_SERVER_ERROR)
      ]);
    }
  }

  return Promise.resolve([cities, null]);
}
