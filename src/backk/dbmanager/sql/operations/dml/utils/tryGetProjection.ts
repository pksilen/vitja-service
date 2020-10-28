import getFieldsFromGraphQlOrJson from '../../../../../graphql/getFieldsFromGraphQlOrJson';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import getFieldsForEntity from './getFieldsForEntity';

export default function tryGetProjection(
  schema: string,
  projection: Projection,
  entityClass: Function,
  Types: object,
  isInternalCall = false
) {
  const fields: string[] = [];

  if (projection.includeResponseFields?.[0]?.includes('{')) {
    projection.includeResponseFields = getFieldsFromGraphQlOrJson(projection.includeResponseFields[0]);
  }

  if (projection.excludeResponseFields?.[0]?.includes('{')) {
    projection.excludeResponseFields = getFieldsFromGraphQlOrJson(projection.excludeResponseFields[0]);
  }

  if (projection.includeResponseFields) {
    const fields: string[] = [];

    projection.includeResponseFields.forEach((includeResponseField) => {
      getFieldsForEntity(
        schema,
        fields,
        entityClass as any,
        Types,
        { includeResponseFields: [includeResponseField] },
        '',
        isInternalCall
      );

      if (fields.length === 0) {
        throw new Error('400:Invalid field: ' + includeResponseField + ' in includeResponseFields');
      }
    });
  }

  if (projection.excludeResponseFields) {
    const fields: string[] = [];

    projection.excludeResponseFields.forEach((excludeResponseField) => {
      getFieldsForEntity(
        schema,
        fields,
        entityClass as any,
        Types,
        { includeResponseFields: [excludeResponseField] },
        '',
        isInternalCall
      );

      if (fields.length === 0) {
        throw new Error('400:Invalid field: ' + excludeResponseField + ' in excludeResponseFields');
      }
    });
  }

  getFieldsForEntity(schema, fields, entityClass as any, Types, projection, '', isInternalCall);
  return fields.join(', ');
}
