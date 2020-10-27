import SqlExpression from "../../expressions/SqlExpression";
import { pg } from "yesql";
import tryGetWhereStatement from "./utils/tryGetWhereStatement";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import getFilterValues from "./utils/getFilterValues";
import getJoinStatement from "./utils/getJoinStatement";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";

export default async function getEntitiesCount<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[] | undefined,
  entityClass: new () => T,
  Types: object
): Promise<number | ErrorResponse> {
  try {
    const whereStatement = tryGetWhereStatement(dbManager.schema, filters ?? {}, entityClass, Types);
    const filterValues = getFilterValues(filters ?? {});
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(`SELECT COUNT(*) FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} ${whereStatement}`)(
        filterValues
      )
    );

    return result.rows[0].count;
  } catch (error) {
    return getErrorResponse(error);
  }
}
