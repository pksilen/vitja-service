import { ObjectId } from 'mongodb';

export default function replaceIdStringsWithObjectIds(filters: any) {
  Object.entries(filters).forEach(([filterName, filterValueOrValues]: [string, any]) => {
    if (filterName === '_id') {
      if (typeof filterValueOrValues === 'string') {
        filters[filterName] = new ObjectId(filterValueOrValues);
      } else if (
        Array.isArray(filterValueOrValues) &&
        filterValueOrValues.length > 0 &&
        typeof filterValueOrValues[0] === 'string'
      ) {
        filters[filterName] = filterValueOrValues.map((filterValue) => new ObjectId(filterValue));
      }
    }

    if (typeof filterValueOrValues === 'object' && filterValueOrValues !== null) {
      if (
        Array.isArray(filterValueOrValues) &&
        filterValueOrValues.length > 0 &&
        typeof filterValueOrValues[0] === 'object'
      ) {
        filterValueOrValues.forEach((subFilterValue) => replaceIdStringsWithObjectIds(subFilterValue));
      } else {
        replaceIdStringsWithObjectIds(filterValueOrValues);
      }
    }
  });
}
