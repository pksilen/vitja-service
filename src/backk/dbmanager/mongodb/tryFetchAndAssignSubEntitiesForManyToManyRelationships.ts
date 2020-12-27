import getClassPropertyNameToPropertyTypeNameMap
  from "../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import forEachAsyncSequential from "../../utils/forEachAsyncSequential";
import typePropertyAnnotationContainer from "../../decorators/typeproperty/typePropertyAnnotationContainer";
import AbstractDbManager from "../AbstractDbManager";
import { PostQueryOperations } from "../../types/postqueryoperations/PostQueryOperations";
import DefaultPostQueryOperations from "../../types/postqueryoperations/DefaultPostQueryOperations";

export default function tryFetchAndAssignSubEntitiesForManyToManyRelationships<T>(
  dbManager: AbstractDbManager,
  rows: T[],
  EntityClass: new () => T,
  Types: object,
  postQueryOperations?: PostQueryOperations
) {
  const entityPropertyNameToPropertyTypeMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  forEachAsyncSequential(
    Object.entries(entityPropertyNameToPropertyTypeMap),
    async ([propertyName, propertyTypeName]) => {
      if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)) {
        rows.forEach((row) => {
          const subEntityIds = (row as any)[propertyName];
          // TODO give modified postQueryOperations
          const subEntitiesOrErrorResponse = dbManager.getEntitiesByFilters(
            { _id: { $in: subEntityIds } },
            (Types as any)[propertyTypeName],
            postQueryOperations ?? new DefaultPostQueryOperations()
          );

          if ('errorMessage' in subEntitiesOrErrorResponse) {
            throw subEntitiesOrErrorResponse;
          }

          (row as any)[propertyName] = subEntitiesOrErrorResponse;
        });
      }
    }
  );
}
