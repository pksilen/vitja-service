
import getIncludeFieldsMap from "./getIncludeFieldsMap";
import getExcludeFieldsMap from "./getExcludeFieldsMap";
import { OptionalProjection } from "../../types/OptionalProjection";

export default function getMongoDbProjection(args: OptionalProjection): object {
  // TODO handle nested projection
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
