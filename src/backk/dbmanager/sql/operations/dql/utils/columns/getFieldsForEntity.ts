import { Projection } from "../../../../../../types/postqueryoperations/Projection";
import getTypeMetadata from "../../../../../../metadata/getTypeMetadata";
import typePropertyAnnotationContainer
  from "../../../../../../decorators/typeproperty/typePropertyAnnotationContainer";
import shouldIncludeField from "./shouldIncludeField";

export default function getFieldsForEntity(
  schema: string,
  fields: string[],
  entityClass: Function,
  Types: object,
  projection: Projection,
  fieldPath: string,
  isInternalCall = false
) {
  const entityMetadata = getTypeMetadata(entityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [string, any]) => {
    if (!isInternalCall && typePropertyAnnotationContainer.isTypePropertyPrivate(entityClass, fieldName)) {
      return;
    }

    let baseFieldTypeName = fieldTypeName;
    let isArray = false;

    if (fieldTypeName.endsWith('[]')) {
      baseFieldTypeName = fieldTypeName.slice(0, -2);
      isArray = true;
    }

    if ( baseFieldTypeName !== 'Date' && baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
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
