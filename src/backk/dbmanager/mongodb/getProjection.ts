import getIncludeFieldsMap from './getIncludeFieldsMap';
import getExcludeFieldsMap from './getExcludeFieldsMap';
import { Projection } from '../../types/postqueryoperations/Projection';
import getFieldsFromGraphQlOrJson from '../../graphql/getFieldsFromGraphQlOrJson';

export default function getProjection(projection: Projection): object {
  let includeResponseFields = projection.includeResponseFields;
  if (projection.includeResponseFields?.[0]?.includes('{')) {
    includeResponseFields = getFieldsFromGraphQlOrJson(projection.includeResponseFields[0]);
  }

  let excludeResponseFields = projection.excludeResponseFields;
  if (projection.excludeResponseFields?.[0]?.includes('{')) {
    excludeResponseFields = getFieldsFromGraphQlOrJson(projection.excludeResponseFields[0]);
  }

  const includeFieldsMap = getIncludeFieldsMap(includeResponseFields);
  const excludeFieldsMap = getExcludeFieldsMap(excludeResponseFields);
  return { ...includeFieldsMap, ...excludeFieldsMap };
}
