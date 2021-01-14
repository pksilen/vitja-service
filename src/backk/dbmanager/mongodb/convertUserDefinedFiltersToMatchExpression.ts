import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import UserDefinedFilter from '../../types/userdefinedfilters/UserDefinedFilter';

dayjs.extend(weekOfYear);

function getWhereExpression(userDefinedFilter: UserDefinedFilter) {
  let fieldFunction: Function;
  switch (userDefinedFilter.fieldFunction) {
    case 'ABS':
      fieldFunction = Math.abs;
      break;
    case 'CEILING':
      fieldFunction = Math.ceil;
      break;
    case 'FLOOR':
      fieldFunction = Math.floor;
      break;
    case 'ROUND':
      fieldFunction = Math.round;
      break;
    case 'LENGTH':
      fieldFunction = (value: string) => value.length;
      break;
    case 'LOWER':
      fieldFunction = (value: string) => value.toLowerCase();
      break;
    case 'LTRIM':
      fieldFunction = (value: string) => value.trimStart();
      break;
    case 'RTRIM':
      fieldFunction = (value: string) => value.trimEnd();
      break;
    case 'TRIM':
      fieldFunction = (value: string) => value.trim();
      break;
    case 'UPPER':
      fieldFunction = (value: string) => value.toUpperCase();
      break;
    case 'DAY':
      fieldFunction = (value: Date) => value.getDay();
      break;
    case 'HOUR':
      fieldFunction = (value: Date) => value.getHours();
      break;
    case 'MINUTE':
      fieldFunction = (value: Date) => value.getMinutes();
      break;
    case 'MONTH':
      fieldFunction = (value: Date) => value.getMonth();
      break;
    case 'QUARTER':
      fieldFunction = (value: Date) => {
        if (value.getMonth() >= 0 && value.getMonth() <= 2) {
          return 1;
        } else if (value.getMonth() >= 3 && value.getMonth() <= 5) {
          return 2;
        } else if (value.getMonth() >= 6 && value.getMonth() <= 8) {
          return 3;
        } else if (value.getMonth() >= 9 && value.getMonth() <= 11) {
          return 4;
        }
        return NaN;
      };
      break;
    case 'SECOND':
      fieldFunction = (value: Date) => value.getSeconds();
      break;
    case 'WEEK':
      fieldFunction = (value: Date) => dayjs(value).week();
      break;
    case 'WEEKDAY':
      fieldFunction = (value: Date) => dayjs(value).day();
      break;
    case 'YEAR':
      fieldFunction = (value: Date) => value.getFullYear();
      break;
  }

  switch (userDefinedFilter.operator) {
    case '=':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) === userDefinedFilter.value;
        }
      };
    case '!=':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) !== userDefinedFilter.value;
        }
      };
    case '>':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) > userDefinedFilter.value;
        }
      };
    case '<':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) < userDefinedFilter.value;
        }
      };
    case '>=':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) >= userDefinedFilter.value;
        }
      };
    case '<=':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) <= userDefinedFilter.value;
        }
      };
    case 'IN':
      return {
        $where: function() {
          return userDefinedFilter.value.some(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (v: any) => fieldFunction((this as any)[userDefinedFilter.fieldName!]) == v
          );
        }
      };
    case 'NOT IN':
      return {
        $where: function() {
          return !userDefinedFilter.value.some(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (v: any) => fieldFunction((this as any)[userDefinedFilter.fieldName!]) == v
          );
        }
      };
    case 'LIKE':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]).match(
            new RegExp(userDefinedFilter.value)
          );
        }
      };
    case 'NOT LIKE':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return !fieldFunction((this as any)[userDefinedFilter.fieldName!]).match(
            new RegExp(userDefinedFilter.value)
          );
        }
      };
    case 'IS NULL':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) === null;
        }
      };
    case 'IS NOT NULL':
      return {
        $where: function() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return fieldFunction((this as any)[userDefinedFilter.fieldName!]) !== null;
        }
      };
  }
}

export default function convertUserDefinedFiltersToMatchExpression(
  userDefinedFilters: UserDefinedFilter[]
): object {
  return userDefinedFilters.reduce((matchExpressions, userDefinedFilter) => {
    let matchExpression;

    if (!userDefinedFilter.fieldName) {
      throw new Error('fieldName is not defined for user defined filter');
    }

    if (userDefinedFilter.fieldFunction) {
      matchExpression = getWhereExpression(userDefinedFilter);
    } else if (userDefinedFilter.operator === '=') {
      matchExpression = { [userDefinedFilter.fieldName]: userDefinedFilter.value };
    } else if (userDefinedFilter.operator === '!=') {
      matchExpression = { $ne: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === '>') {
      matchExpression = { $gt: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === '<') {
      matchExpression = { $lt: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === '>=') {
      matchExpression = { $gte: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === '<=') {
      matchExpression = { $lte: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === 'IN') {
      matchExpression = { $in: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === 'NOT IN') {
      matchExpression = { $nin: { [userDefinedFilter.fieldName]: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === 'LIKE') {
      matchExpression = { [userDefinedFilter.fieldName]: new RegExp(userDefinedFilter.value) };
    } else if (userDefinedFilter.operator === 'NOT LIKE') {
      matchExpression = { [userDefinedFilter.fieldName]: { $not: userDefinedFilter.value } };
    } else if (userDefinedFilter.operator === 'IS NULL') {
      matchExpression = { [userDefinedFilter.fieldName]: null };
    } else if (userDefinedFilter.operator === 'IS NOT NULL') {
      matchExpression = { $ne: { [userDefinedFilter.fieldName]: null } };
    } else if (userDefinedFilter.operator === 'OR' && userDefinedFilter.orFilters) {
      matchExpression = {
        $or: userDefinedFilter.orFilters.map((orFilter) =>
          convertUserDefinedFiltersToMatchExpression([orFilter])
        )
      };
    }

    return {
      ...matchExpressions,
      ...matchExpression
    };
  }, {});
}
