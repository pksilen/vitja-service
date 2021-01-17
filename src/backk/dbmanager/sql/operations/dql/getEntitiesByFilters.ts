import SqlExpression from "../../expressions/SqlExpression";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import UserDefinedFilter from "../../../../types/userdefinedfilters/UserDefinedFilter";

export default async function getEntitiesByFilters<T>(
  dbManager: AbstractSqlDbManager,
  filters: Partial<T> | SqlExpression[] | UserDefinedFilter[],
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();

  try {
    const {
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      columns,
      joinClauses,
      filterValues
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, EntityClass, filters, false, true);

    const selectStatement = `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} as ${EntityClass.name.toLowerCase()} ${rootWhereClause} ${rootSortClause} ${rootPaginationClause}) ${joinClauses}`;
    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    return transformRowsToObjects(dbManager.getResultRows(result), EntityClass, postQueryOperations, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
