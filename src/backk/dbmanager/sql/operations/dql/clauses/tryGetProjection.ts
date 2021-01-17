import getFieldsFromGraphQlOrJson from "../../../../../graphql/getFieldsFromGraphQlOrJson";
import { Projection } from "../../../../../types/postqueryoperations/Projection";
import getFieldsForEntity from "../utils/columns/getFieldsForEntity";
import createErrorMessageWithStatusCode from "../../../../../errors/createErrorMessageWithStatusCode";
import AbstractSqlDbManager from "../../../../AbstractSqlDbManager";

export default function tryGetProjection(
  dbManager: AbstractSqlDbManager,
  projection: Projection,
  EntityClass: Function,
  Types: object,
  isInternalCall = false,
  useRootEntity = false
): string {
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
        dbManager,
        fields,
        EntityClass as any,
        Types,
        { includeResponseFields: [includeResponseField] },
        '',
        isInternalCall,
        useRootEntity
      );

      if (fields.length === 0) {
        throw new Error(
          createErrorMessageWithStatusCode(
            'Invalid field: ' + includeResponseField + ' in includeResponseFields',
            400
          )
        );
      }
    });
  }

  if (projection.excludeResponseFields) {
    const fields: string[] = [];

    projection.excludeResponseFields.forEach((excludeResponseField) => {
      getFieldsForEntity(
        dbManager,
        fields,
        EntityClass as any,
        Types,
        { includeResponseFields: [excludeResponseField] },
        '',
        isInternalCall,
        useRootEntity
      );

      if (fields.length === 0) {
        throw new Error(
          createErrorMessageWithStatusCode(
            'Invalid field: ' + excludeResponseField + ' in excludeResponseFields',
            400
          )
        );
      }
    });
  }

  getFieldsForEntity(dbManager, fields, EntityClass as any, Types, projection, '', isInternalCall, useRootEntity);
  return fields.join(', ');
}
