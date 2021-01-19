import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import convertUserDefinedFilterToSqlString from '../utils/convertUserDefinedFilterToSqlString';
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
        .filter(
          (sqlExpression) =>
            sqlExpression.subEntityPath === subEntityPath ||
            (subEntityPath === '' && !sqlExpression.subEntityPath) ||
            sqlExpression.subEntityPath === '*'
        )
        .map((userDefinedFilter, index) => convertUserDefinedFilterToSqlString(userDefinedFilter, index))
        .join(' AND ');
    }
  }

  return filtersSql ? `WHERE ${filtersSql}` : '';
}
