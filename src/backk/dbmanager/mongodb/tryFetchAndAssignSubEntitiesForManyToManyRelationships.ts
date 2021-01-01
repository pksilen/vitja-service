import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager from '../AbstractDbManager';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import DefaultPostQueryOperations from '../../types/postqueryoperations/DefaultPostQueryOperations';
import forEachAsyncParallel from '../../utils/forEachAsyncParallel';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';
import { ObjectId } from 'mongodb';

export default async function tryFetchAndAssignSubEntitiesForManyToManyRelationships<T>(
  dbManager: AbstractDbManager,
  rows: T[],
  EntityClass: new () => T,
  Types: object,
  postQueryOperations?: PostQueryOperations
): Promise<void> {
  const entityPropertyNameToPropertyTypeMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  await forEachAsyncParallel(
    Object.entries(entityPropertyNameToPropertyTypeMap),
    async ([propertyName, propertyTypeName]) => {
      if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)) {
        await forEachAsyncParallel(rows, async (row: any) => {
          const subEntityIds: string[] | undefined = row[propertyName];
          if (subEntityIds) {
            // TODO give modified postQueryOperations
            const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
            const subEntitiesOrErrorResponse = await dbManager.getEntitiesByFilters(
              { _id: { $in: subEntityIds.map((subEntityId) => new ObjectId(subEntityId)) } },
              (Types as any)[baseTypeName],
              postQueryOperations ?? new DefaultPostQueryOperations()
            );

            if ('errorMessage' in subEntitiesOrErrorResponse) {
              throw subEntitiesOrErrorResponse;
            }

            row[propertyName] = subEntitiesOrErrorResponse;
          }
        });
      }
    }
  );
}
