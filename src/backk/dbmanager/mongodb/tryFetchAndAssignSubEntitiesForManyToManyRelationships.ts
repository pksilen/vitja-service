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
import MongoDbQuery from './MongoDbQuery';
import replaceSubEntityPaths from './replaceSubEntityPaths';
import replaceFieldPathNames from './replaceFieldPathNames';
import getProjection from './getProjection';
import getRootProjection from './getRootProjection';

export default async function tryFetchAndAssignSubEntitiesForManyToManyRelationships<T>(
  dbManager: AbstractDbManager,
  rows: T[],
  EntityClass: new () => T,
  Types: object,
  filters?: Array<MongoDbQuery<T>>,
  postQueryOperations?: PostQueryOperations,
  propertyJsonPath = '$.',
  subEntityPath = ''
): Promise<void> {
  const entityPropertyNameToPropertyTypeMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);
  const projection = getProjection(EntityClass, postQueryOperations);

  await forEachAsyncParallel(
    Object.entries(entityPropertyNameToPropertyTypeMap),
    async ([propertyName, propertyTypeName]) => {
      if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)) {
        const wantedSubEntityPath = subEntityPath ? subEntityPath + '.' + propertyName : propertyName;
        const foundProjection = Object.keys(projection).find((fieldPathName) =>
          fieldPathName.startsWith(wantedSubEntityPath)
        );

        if (!foundProjection) {
          return;
        }

        await forEachAsyncParallel(rows, async (row: any) => {
          const [subEntityIds] = JSONPath({
            json: row,
            path: propertyJsonPath + propertyName
          });

          const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);

          let subEntityFilters = replaceSubEntityPaths(filters, wantedSubEntityPath);
          subEntityFilters = subEntityFilters.map((subEntityFilter) => {
            if ('filterQuery' in subEntityFilter) {
              return new MongoDbQuery(subEntityFilter.filterQuery, subEntityFilter.subEntityPath);
            }
            return subEntityFilter;
          });

          const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

          const subEntitySortBys = replaceSubEntityPaths(
            finalPostQueryOperations.sortBys,
            wantedSubEntityPath
          );

          const subEntityPaginations = replaceSubEntityPaths(
            finalPostQueryOperations.paginations,
            wantedSubEntityPath
          );

          const subEntityIncludeResponseFields = replaceFieldPathNames(
            finalPostQueryOperations.includeResponseFields,
            wantedSubEntityPath
          );

          const subEntityExcludeResponseFields = replaceFieldPathNames(
            finalPostQueryOperations.excludeResponseFields,
            wantedSubEntityPath
          );

          const [subEntities, error] = await dbManager.getEntitiesByFilters(
            [
              new MongoDbQuery({
                _id: { $in: (subEntityIds ?? []).map((subEntityId: any) => new ObjectId(subEntityId)) }
              }),
              ...(subEntityFilters ?? [])
            ],
            (Types as any)[baseTypeName],
            {
              includeResponseFields: subEntityIncludeResponseFields,
              excludeResponseFields: subEntityExcludeResponseFields,
              sortBys: subEntitySortBys,
              paginations: subEntityPaginations
            }
          );

          if (error) {
            throw error;
          }

          const [subEntitiesParent] = JSONPath({ json: row, path: propertyJsonPath + propertyName + '^' });
          if (subEntitiesParent) {
            subEntitiesParent[propertyName] = subEntities;
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
          filters,
          postQueryOperations,
          propertyJsonPath + propertyName + '[*].',
          subEntityPath + propertyName
        );
      }
    }
  );
}
