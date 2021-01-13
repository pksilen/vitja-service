import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager from '../AbstractDbManager';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import DefaultPostQueryOperations from '../../types/postqueryoperations/DefaultPostQueryOperations';
import forEachAsyncParallel from '../../utils/forEachAsyncParallel';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';
import { ObjectId } from 'mongodb';
import isEntityTypeName from '../../utils/type/isEntityTypeName';
import { JSONPath } from 'jsonpath-plus';
import util from "util";

export default async function tryFetchAndAssignSubEntitiesForManyToManyRelationships<T>(
  dbManager: AbstractDbManager,
  rows: T[],
  EntityClass: new () => T,
  Types: object,
  postQueryOperations?: PostQueryOperations,
  propertyJsonPath = '$.'
): Promise<void> {
  const entityPropertyNameToPropertyTypeMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  await forEachAsyncParallel(
    Object.entries(entityPropertyNameToPropertyTypeMap),
    async ([propertyName, propertyTypeName]) => {
      if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)) {
        await forEachAsyncParallel(rows, async (row: any) => {
          const [subEntityIds] = JSONPath({
            json: row,
            path: propertyJsonPath + propertyName
          });

          if (subEntityIds) {
            // TODO give modified postQueryOperations
            const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
            const subEntitiesOrErrorResponse = await dbManager.getEntitiesByFilters(
              { _id: { $in: subEntityIds.map((subEntityId: any) => new ObjectId(subEntityId)) } },
              (Types as any)[baseTypeName],
              postQueryOperations ?? new DefaultPostQueryOperations()
            );

            if ('errorMessage' in subEntitiesOrErrorResponse) {
              throw subEntitiesOrErrorResponse;
            }

            const [subEntitiesParent] = JSONPath({ json: row, path: propertyJsonPath + propertyName + '^' });
            subEntitiesParent[propertyName] = subEntitiesOrErrorResponse;
          }
        });
      }

      const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
      const SubEntityClass = (Types as any)[baseTypeName];

      if (isEntityTypeName(baseTypeName)) {
        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          dbManager,
          rows,
          SubEntityClass,
          Types,
          postQueryOperations,
          propertyJsonPath + propertyName + '[*].'
        );
      }
    }
  );
}
