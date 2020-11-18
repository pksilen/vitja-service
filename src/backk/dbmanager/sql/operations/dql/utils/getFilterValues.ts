import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import SqlInExpression from '../../../expressions/SqlInExpression';

export default function getFilterValues<T>(filters: Partial<T> | SqlExpression[] | UserDefinedFilter[]) {
  if (Array.isArray(filters)) {
    if (filters.length === 0) {
      return {};
    } else if (filters[0] instanceof SqlExpression) {
      return (filters as SqlExpression[]).reduce(
        (accumulatedFilterValues, sqlExpression) => ({
          ...accumulatedFilterValues,
          ...sqlExpression.getValues()
        }),
        {}
      );
    } else {
      return (filters as UserDefinedFilter[]).reduce(
        (accumulatedFilterValues, { fieldName, operator, value }) => ({
          ...accumulatedFilterValues,
          ...(operator === 'IN' || operator === 'NOT IN'
            ? new SqlInExpression(fieldName, value)
            : { [fieldName]: value })
        }),
        {}
      );
    }
  }

  return filters;
}
