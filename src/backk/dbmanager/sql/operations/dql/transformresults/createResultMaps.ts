import shouldIncludeField from '../utils/columns/shouldIncludeField';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import getPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import getTypeInfoFromMetadataType from '../../../../../utils/type/getTypeInfoFromMetadataType';

function updateResultMaps(
  entityClassOrName: Function | string,
  Types: object,
  resultMaps: any[],
  projection: Projection,
  fieldPath: string,
  suppliedEntityMetadata: { [key: string]: string } = {},
  parentEntityClass?: Function
) {
  const entityMetadata =
    typeof entityClassOrName === 'function'
      ? getPropertyNameToPropertyTypeNameMap(entityClassOrName as any)
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

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [string, any]) => {
    const { baseTypeName, isArrayType } = getTypeInfoFromMetadataType(fieldTypeName);

    if (
      isArrayType &&
      baseTypeName !== 'Date' &&
      baseTypeName[0] === baseTypeName[0].toUpperCase() &&
      baseTypeName[0] !== '('
    ) {
      if (shouldIncludeField(fieldName, fieldPath, projection)) {
        const relationEntityName = baseTypeName;

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
    } else if (
      baseTypeName !== 'Date' &&
      baseTypeName[0] === baseTypeName[0].toUpperCase() &&
      baseTypeName[0] !== '('
    ) {
      if (shouldIncludeField(fieldName, fieldPath, projection)) {
        const relationEntityName = baseTypeName;

        resultMap.associations.push({
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
    } else if (isArrayType) {
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

export default function createResultMaps(entityClass: Function, Types: object, projection: Projection) {
  const resultMaps: any[] = [];
  updateResultMaps(entityClass, Types, resultMaps, projection, '');
  return resultMaps;
}
