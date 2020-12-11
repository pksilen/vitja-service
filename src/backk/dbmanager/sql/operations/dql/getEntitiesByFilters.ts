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
      columns,
      joinClause,
      whereClause,
      filterValues,
      sortClause,
      pagingClause
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, EntityClass, filters);

    const result = await dbManager.tryExecuteQueryWithNamedParameters(
      `SELECT ${columns} FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} ${joinClause} ${whereClause} ${sortClause} ${pagingClause}`,
      filterValues
    );

    return transformRowsToObjects(dbManager.getResultRows(result), EntityClass, postQueryOperations, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
