import getFieldsFromGraphQlOrJson from '../../../../../graphql/getFieldsFromGraphQlOrJson';
import shouldIncludeField from './shouldIncludeField';
import { OptionalProjection } from "../../../../../types/OptionalProjection";
import getTypeMetadata from "../../../../../metadata/getTypeMetadata";

function getFieldsForEntity(
  schema: string,
  fields: string[],
  entityClass: Function,
  Types: object,
  projection: OptionalProjection,
  fieldPath: string
) {
  const entityMetadata = getTypeMetadata(entityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [string, any]) => {
    let baseFieldTypeName = fieldTypeName;
    let isArray = false;

    if (fieldTypeName.endsWith('[]')) {
      baseFieldTypeName = fieldTypeName.slice(0, -2);
      isArray = true;
    }

    if (baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
      getFieldsForEntity(
        schema,
        fields,
        (Types as any)[baseFieldTypeName],
        Types,
        projection,
        fieldPath + fieldName + '.'
      );
    } else if (isArray) {
      if (shouldIncludeField(fieldName, fieldPath, projection)) {
        const relationEntityName = entityClass.name + fieldName.slice(0, -1);
        const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';
        fields.push(`${schema}.${relationEntityName}.${idFieldName} AS ${relationEntityName}_${idFieldName}`);

        const singularFieldName = fieldName.slice(0, -1);

        fields.push(
          `${schema}.${relationEntityName}.${singularFieldName} AS ${relationEntityName}_${singularFieldName}`
        );
        fields.push(`${schema}.${relationEntityName}.id AS ${relationEntityName}_id`);
      }
    } else {
      if (shouldIncludeField(fieldName, fieldPath, projection)) {
        if (fieldName === '_id' || fieldName === 'id' || fieldName.endsWith('Id')) {
          fields.push(
            `CAST(${schema}.${entityClass.name}.${fieldName} AS VARCHAR) AS ${entityClass.name}_${fieldName}`
          );
        } else {
          fields.push(`${schema}.${entityClass.name}.${fieldName} AS ${entityClass.name}_${fieldName}`);
        }
      }
    }
  });
}

export default function tryGetProjection(
  schema: string,
  projection: OptionalProjection,
  entityClass: Function,
  Types: object
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
        ''
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
        ''
      );

      if (fields.length === 0) {
        throw new Error('400:Invalid field: ' + excludeResponseField + ' in excludeResponseFields');
      }
    });
  }

  getFieldsForEntity(schema, fields, entityClass as any, Types, projection, '');
  return fields.join(', ');
}
