import shouldIncludeField from './shouldIncludeField';
import { OptionalProjection } from "../../../../../types/OptionalProjection";
import getTypeMetadata from "../../../../../metadata/getTypeMetadata";

function updateResultMaps(
  entityClassOrName: Function | string,
  Types: object,
  resultMaps: any[],
  projection: OptionalProjection,
  fieldPath: string,
  suppliedEntityMetadata: { [key: string]: string } = {},
  parentEntityClass?: Function
) {
  const entityMetadata =
    typeof entityClassOrName === 'function'
      ? getTypeMetadata(entityClassOrName as any)
      : suppliedEntityMetadata;

  const entityName = typeof entityClassOrName === 'function' ? entityClassOrName.name : entityClassOrName;
  const idFieldName = parentEntityClass ? 'id' : '_id';

  const resultMap = {
    mapId: entityName + 'Map',
    idProperty: idFieldName,
    properties: [] as object[],
    collections: [] as object[],
    associations: [] as object[]
  };

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
    let baseFieldTypeName = fieldTypeName;
    let isArray = false;

    if (fieldTypeName.endsWith('[]')) {
      baseFieldTypeName = fieldTypeName.slice(0, -2);
      isArray = true;
    }

    if (baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
      if (shouldIncludeField(fieldName, fieldPath, projection)) {
        const relationEntityName = baseFieldTypeName;

        resultMap.collections.push({
          name: fieldName,
          mapId: relationEntityName + 'Map',
          columnPrefix: relationEntityName.toLowerCase() + '_'
        });

        updateResultMaps(
          (Types as any)[relationEntityName],
          Types,
          resultMaps,
          projection,
          fieldPath + fieldName + '.',
          {},
          entityClassOrName as Function
        );
      }
    } else if (isArray) {
      if (shouldIncludeField(fieldName, fieldPath, projection)) {
        const relationEntityName = entityName + fieldName.slice(0, -1);

        resultMap.collections.push({
          name: fieldName,
          mapId: relationEntityName + 'Map',
          columnPrefix: relationEntityName.toLowerCase() + '_'
        });

        updateResultMaps(
          relationEntityName,
          Types,
          resultMaps,
          projection,
          fieldPath + fieldName + '.',
          {
            id: 'integer',
            [fieldName.slice(0, -1)]: 'integer'
          },
          entityClassOrName as Function
        );
      }
    } else {
      if ((!parentEntityClass && fieldName !== '_id') || (parentEntityClass && fieldName !== 'id')) {
        if (shouldIncludeField(fieldName, fieldPath, projection)) {
          resultMap.properties.push({ name: fieldName, column: fieldName.toLowerCase() });
        }
      }
    }
  });

  resultMaps.push(resultMap);
}

export default function createResultMaps(
  entityClass: Function,
  Types: object,
  projection: OptionalProjection
) {
  const resultMaps: any[] = [];
  updateResultMaps(entityClass, Types, resultMaps, projection, '');
  return resultMaps;
}
