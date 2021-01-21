import SqlExpression from "../../expressions/SqlExpression";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import UserDefinedFilter from "../../../../types/userdefinedfilters/UserDefinedFilter";
import MongoDbQuery from "../../../mongodb/MongoDbQuery";

export default async function getEntitiesByFilters<T>(
  dbManager: AbstractSqlDbManager,
  filters: Array<MongoDbQuery<T>> | SqlExpression[] | UserDefinedFilter[],
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  if (filters?.[0] instanceof MongoDbQuery) {
    throw new Error('filters must be SqlExpression array or UserDefinedFilter array');
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const {
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      columns,
      joinClauses,
      filterValues,
      outerSortClause
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, EntityClass, filters as any);

    const tableName = EntityClass.name.toLowerCase();
    const tableAlias = dbManager.schema + '_' + tableName;

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      `) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      postQueryOperations,
      dbManager.getTypes()
    );
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
