import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import SqlInExpression from '../../../expressions/SqlInExpression';
import SqlNotInExpression from '../../../expressions/SqlNotInExpression';

function getUserDefinedFilterValues(filters: UserDefinedFilter[], parentIndex?: number): object {
  return filters.reduce((accumulatedFilterValues, userDefinedFilter, index) => {
    if (userDefinedFilter.operator === 'OR') {
      return getUserDefinedFilterValues(userDefinedFilter.orFilters ?? [], index);
    }

    if (!userDefinedFilter.fieldName) {
      throw new Error('fieldName not defined for user defined filter');
    }

    let finalIndexStr = index.toString();
    if (parentIndex !== undefined) {
      finalIndexStr = parentIndex + '_' + index;
    }

    let filterValues = {
      [userDefinedFilter.fieldName + finalIndexStr]: userDefinedFilter.value
    };

    if (userDefinedFilter.operator === 'IN') {
      filterValues = new SqlInExpression(userDefinedFilter.fieldName, userDefinedFilter.value).getValues();
    } else if (userDefinedFilter.operator === 'NOT IN') {
      filterValues = new SqlNotInExpression(userDefinedFilter.fieldName, userDefinedFilter.value).getValues();
    }

    return {
      ...accumulatedFilterValues,
      ...filterValues
    };
  }, {});
}

export default function getFilterValues<T>(
  filters: Partial<T> | SqlExpression[] | UserDefinedFilter[]
): object {
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
      return getUserDefinedFilterValues(filters as UserDefinedFilter[]);
    }
  }

  return filters;
}
