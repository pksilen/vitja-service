
import getIncludeFieldsMap from "./getIncludeFieldsMap";
import getExcludeFieldsMap from "./getExcludeFieldsMap";
import { Projection } from "../../types/postqueryoperations/Projection";

export default function getMongoDbProjection(args: Projection): object {
  // TODO handle nested projection
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
