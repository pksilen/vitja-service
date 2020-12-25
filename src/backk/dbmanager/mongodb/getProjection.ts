
import getIncludeFieldsMap from "./getIncludeFieldsMap";
import getExcludeFieldsMap from "./getExcludeFieldsMap";
import { Projection } from "../../types/postqueryoperations/Projection";

export default function getProjection(args: Projection): object {
  // TODO remove private fields
  const includeFieldsMap = getIncludeFieldsMap(args.includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(args.excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
