import SqlExpression from "../../expressions/SqlExpression";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import UserDefinedFilter from "../../../../types/userdefinedfilters/UserDefinedFilter";
import MongoDbQuery from "../../../mongodb/MongoDbQuery";

export default async function getEntitiesCount<T>(
  dbManager: AbstractSqlDbManager,
  filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | undefined,
  EntityClass: new () => T
): Promise<number | ErrorResponse> {
  if (filters?.find((filter) => filter instanceof MongoDbQuery)) {
    throw new Error('filters must be an array of SqlExpressions and/or UserDefinedFilters');
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const { rootWhereClause, filterValues } = getSqlSelectStatementParts(
      dbManager,
      new DefaultPostQueryOperations(),
      EntityClass,
      filters as SqlExpression[] | UserDefinedFilter[] | undefined
    );

    const tableName = EntityClass.name.toLowerCase();

    const sqlStatement = [`SELECT COUNT(*) FROM ${dbManager.schema}.${tableName}`, rootWhereClause]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(sqlStatement, filterValues);

    return dbManager.getResultRows(result)[0].count;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
