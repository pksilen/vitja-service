import SqlExpression from '../../expressions/SqlExpression';
import getBadRequestErrorResponse from '../../../../errors/getBadRequestErrorResponse';
import { pg } from 'yesql';
import getInternalServerErrorResponse from '../../../../errors/getInternalServerErrorResponse';
import tryGetWhereStatement from './utils/tryGetWhereStatement';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getFilterValues from './utils/getFilterValues';
import getJoinStatement from './utils/getJoinStatement';
import { ErrorResponse } from "../../../../types/ErrorResponse";

export default async function getItemsCount<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[] | undefined,
  entityClass: new () => T,
  Types: object
): Promise<number | ErrorResponse> {
  try {
    let whereStatement;
    try {
      whereStatement = tryGetWhereStatement(dbManager.schema, filters ?? {}, entityClass, Types);
    } catch (error) {
      return getBadRequestErrorResponse(error.message);
    }

    const filterValues = getFilterValues(filters ?? {});
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(`SELECT COUNT(*) FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} ${whereStatement}`)(
        filterValues
      )
    );

    return result.rows[0].count;
  } catch (error) {
    return getInternalServerErrorResponse(error);
  }
}
