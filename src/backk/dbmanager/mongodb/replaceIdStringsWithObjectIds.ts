import { ObjectId } from 'mongodb';
import isExternalIdProperty from '../../utils/type/isExternalIdProperty';

export default function replaceIdStringsWithObjectIds(
  filters: any,
  EntityClass: new () => any,
  Types: any,
  prevFieldName = ''
): void {
  Object.entries(filters).forEach(([filterName, filterValue]: [string, any]) => {
    if (
      (filterName.endsWith('_id') ||
        (filterName.endsWith('Id') && !isExternalIdProperty(filterName, Types, EntityClass))) &&
      typeof filterValue === 'string'
    ) {
      filters[filterName] = new ObjectId(filterValue);
    } else if (
      prevFieldName.endsWith('_id') &&
      filterName === '$in' &&
      Array.isArray(filterValue) &&
      filterValue.length > 0 &&
      typeof filterValue[0] === 'string'
    ) {
      filters[filterName] = filterValue.map((filterValue) => new ObjectId(filterValue));
    }

    if (typeof filterValue === 'object' && filterValue !== null && !Array.isArray(filterValue)) {
      replaceIdStringsWithObjectIds(
        filterValue,
        EntityClass,
        Types,
        filterName.startsWith('$') ? prevFieldName : filterName
      );
    }
  });
}
