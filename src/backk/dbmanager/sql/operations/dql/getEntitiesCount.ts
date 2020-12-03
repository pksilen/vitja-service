import SqlExpression from "../../expressions/SqlExpression";
import { pg } from "yesql";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";

export default async function getEntitiesCount<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[] | undefined,
  EntityClass: new () => T
): Promise<number | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();

  try {
    const { joinClause, whereClause, filterValues } = getSqlSelectStatementParts(
      dbManager,
      new DefaultPostQueryOperations(),
      EntityClass
    );

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(`SELECT COUNT(*) FROM ${dbManager.schema}.${EntityClass.name} ${joinClause} ${whereClause}`)(
        filterValues
      )
    );

    return result.rows[0].count;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
