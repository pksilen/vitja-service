import SqlExpression from '../../../../sqlexpression/SqlExpression';

export default function getFilterValues<T>(filters: Partial<T> | SqlExpression[]) {
  if (Array.isArray(filters)) {
    return filters.reduce(
      (filterValues, sqlExpression) => ({ ...filterValues, ...sqlExpression.getValues() }),
      {}
    );
  }

  return filters;
}
