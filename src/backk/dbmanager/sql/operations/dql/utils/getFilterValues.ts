import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import SqlInExpression from '../../../expressions/SqlInExpression';
import SqlNotInExpression from "../../../expressions/SqlNotInExpression";

function getUserDefinedFilterValues(filters: UserDefinedFilter[]): object {
  return filters.reduce((accumulatedFilterValues, { fieldName, operator, value, filters }, index) => {
    if (operator === 'OR') {
      return getUserDefinedFilterValues(filters ?? []);
    }

    let filterValues = { [fieldName + index]: value };
    if (operator === 'IN') {
      filterValues = new SqlInExpression(fieldName, value).getValues();
    } else if (operator === 'NOT IN') {
      filterValues = new SqlNotInExpression(fieldName, value).getValues();
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
