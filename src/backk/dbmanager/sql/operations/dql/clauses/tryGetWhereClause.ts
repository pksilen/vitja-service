import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import convertUserDefinedFilterToSqlExpression from '../utils/convertUserDefinedFilterToSqlExpression';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';

export default function tryGetWhereClause<T>(
  dbManager: AbstractSqlDbManager,
  subEntityPath: string,
  filters?: SqlExpression[] | UserDefinedFilter[]
) {
  let filtersSql: string = '';

  if (Array.isArray(filters) && filters.length > 0) {
    if (filters[0] instanceof SqlExpression) {
      filtersSql = (filters as SqlExpression[])
        .filter(
          (sqlExpression) =>
            sqlExpression.subEntityPath === subEntityPath ||
            (subEntityPath === '' && !sqlExpression.subEntityPath) ||
            sqlExpression.subEntityPath === '*'
        )
        .filter((sqlExpression) => sqlExpression.hasValues())
        .map((sqlExpression) => sqlExpression.toSqlString())
        .join(' AND ');
    } else {
      filtersSql = (filters as UserDefinedFilter[])
        .map((userDefinedFilter, index) => {
          if (
            userDefinedFilter.subEntityPath === subEntityPath ||
            (subEntityPath === '' && !userDefinedFilter.subEntityPath) ||
            userDefinedFilter.subEntityPath === '*'
          ) {
            return convertUserDefinedFilterToSqlExpression(userDefinedFilter, index);
          }

          return undefined;
        }).filter(sqlExpression => sqlExpression)
        .join(' AND ');
    }
  }

  return filtersSql ? `WHERE ${filtersSql}` : '';
}
