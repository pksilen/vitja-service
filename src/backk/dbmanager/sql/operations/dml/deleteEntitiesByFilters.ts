import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { EntityJoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import isErrorResponse from "../../../../errors/isErrorResponse";
import tryStartLocalTransactionIfNeeded from "../transaction/tryStartLocalTransactionIfNeeded";
import tryCommitLocalTransactionIfNeeded from "../transaction/tryCommitLocalTransactionIfNeeded";
import tryRollbackLocalTransactionIfNeeded from "../transaction/tryRollbackLocalTransactionIfNeeded";
import cleanupLocalTransactionIfNeeded from "../transaction/cleanupLocalTransactionIfNeeded";
import SqlExpression from "../../expressions/SqlExpression";
import UserDefinedFilter from "../../../../types/userdefinedfilters/UserDefinedFilter";
import tryGetWhereClause from "../dql/clauses/tryGetWhereClause";
import getFilterValues from "../dql/utils/getFilterValues";
import MongoDbQuery from "../../../mongodb/MongoDbQuery";

export default async function deleteEntitiesByFilters<T extends object>(
  dbManager: AbstractSqlDbManager,
  filters: Array<MongoDbQuery<T>> | SqlExpression[] | UserDefinedFilter[],
  EntityClass: new () => T
): Promise<void | ErrorResponse> {
  if (Array.isArray(filters) && filters.length > 0 && filters[0] instanceof MongoDbQuery) {
    throw new Error('filters must be SqlExpression array or UserDefinedFilter array');
  }

  const nonRootFilters = (filters as any).find((filter: SqlExpression | UserDefinedFilter) => filter.subEntityPath !== '')
  if (nonRootFilters) {
    throw new Error('All filters must be have subEntityPath empty, ie. they must be root filters');
  }

  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    const whereClause = tryGetWhereClause(dbManager, '', filters as any);
    const filterValues = getFilterValues(filters as any);

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          if (!joinSpec.isReadonly) {
            await dbManager.tryExecuteQueryWithNamedParameters(
              `DELETE FROM ${dbManager.schema.toLowerCase()}.${joinSpec.subEntityTableName.toLowerCase()} WHERE ${joinSpec.subEntityForeignIdFieldName.toLowerCase()} IN (SELECT _id FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} ${whereClause})`,
              filterValues
            );
          }
        }
      ),
      forEachAsyncParallel(
        entityContainer.manyToManyRelationTableSpecs,
        async ({ associationTableName, entityForeignIdFieldName }) => {
          if (associationTableName.startsWith(EntityClass.name)) {
            await dbManager.tryExecuteQueryWithNamedParameters(
              `DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} IN (SELECT _id FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} ${whereClause})`,
              filterValues
            );
          }
        }
      ),
      dbManager.tryExecuteQueryWithNamedParameters(
        `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} ${whereClause}`,
        filterValues
      )
    ]);

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
