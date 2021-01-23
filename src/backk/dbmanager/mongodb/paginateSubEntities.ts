import Pagination from '../../types/postqueryoperations/Pagination';
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../utils/type/isEntityTypeName';
import { JSONPath } from 'jsonpath-plus';

function paginateRows<T>(rows: T[], pagination: Pagination, subEntityJsonPath: string, propertyName: string) {
  rows.forEach((row: any) => {
    const [subEntitiesParent] = JSONPath({ json: row, path: subEntityJsonPath + propertyName + '^' });

    subEntitiesParent[propertyName] = subEntitiesParent[propertyName].slice(
      (pagination.pageNumber - 1) * pagination.pageSize,
      pagination.pageNumber * pagination.pageSize
    );
  });
}

export default function paginateSubEntities<T>(
  rows: T[],
  paginations: Pagination[] | undefined,
  EntityClass: new () => any,
  Types: any,
  subEntityPath = '',
  subEntityJsonPath = '$.'
) {
  const entityClassPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  Object.entries(entityClassPropertyNameToPropertyTypeNameMap).forEach(([propertyName, propertyTypeName]) => {
    const { baseTypeName, isArrayType } = getTypeInfoForTypeName(propertyTypeName);

    if (isEntityTypeName(baseTypeName) && isArrayType) {
      let pagination = paginations?.find((pagination) => {
        const wantedSubEntityPath = subEntityPath ? subEntityPath + '.' + propertyName : propertyName;
        return pagination.subEntityPath === wantedSubEntityPath;
      });

      if (!pagination) {
        pagination = paginations?.find((pagination) => pagination.subEntityPath === '*');
      }

      if (pagination) {
        paginateRows(rows, pagination, subEntityJsonPath, propertyName);
      }

      paginateSubEntities(
        rows,
        paginations,
        Types[baseTypeName],
        Types,
        subEntityPath + propertyName + '.',
        subEntityJsonPath + propertyName + '[*].'
      );
    }
  });
}
