import SqlExpression from '../../../sqlexpression/SqlExpression';
import { ErrorResponse, PostQueryOps } from '../../../Backk';
import { types } from 'pg';
import getBadRequestErrorResponse from '../../../getBadRequestErrorResponse';
import { pg } from 'yesql';
import joinjs from 'join-js';
import decryptItems from '../../../crypt/decryptItems';
import getInternalServerErrorResponse from '../../../getInternalServerErrorResponse';
import PostgreSqlDbManager from '../../PostgreSqlDbManager';
import tryGetProjection from './utils/tryGetProjection';
import tryGetSortStatement from './utils/tryGetSortStatement';
import getPagingStatement from './utils/getPagingStatement';
import tryGetWhereStatement from './utils/tryGetWhereStatement';
import getFilterValues from './utils/getFilterValues';
import getJoinStatement from './utils/getJoinStatement';
import createResultMaps from './utils/createResultMaps';
import transformResults from './utils/transformResults';

export default async function getItems<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[],
  { pageNumber, pageSize, sortBys, ...projection }: PostQueryOps,
  entityClass: new () => T,
  Types: object
): Promise<T[] | ErrorResponse> {
  try {
    let columns;
    let whereStatement;
    let sortStatement;
    try {
      columns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
      whereStatement = tryGetWhereStatement(dbManager.schema, filters, entityClass, types);
      sortStatement = tryGetSortStatement(dbManager.schema, sortBys, entityClass, Types);
    } catch (error) {
      return getBadRequestErrorResponse(error.message);
    }

    const filterValues = getFilterValues(filters);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(pageNumber, pageSize);

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(
        `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} ${whereStatement} ${sortStatement} ${pagingStatement}`
      )(filterValues)
    );

    const resultMaps = createResultMaps(entityClass, Types, projection);
    const rows = joinjs.map(
      result.rows,
      resultMaps,
      entityClass.name + 'Map',
      entityClass.name.toLowerCase() + '_'
    );
    transformResults(rows, entityClass, Types);
    decryptItems(rows, entityClass, Types);
    return rows;
  } catch (error) {
    return getInternalServerErrorResponse(error);
  }
}
