function removeSingleSubEntitiesWithNullPropertiesInObject(object: any) {
  Object.entries(object).forEach(([key, value]: [string, any]) => {
    if (
      (Array.isArray(value) && value.length === 1 && typeof value[0] === 'object') ||
      (typeof value === 'object' && !(value instanceof Date) && value !== null)
    ) {
      const emptyValueCount = Object.values(value[0] ?? value).filter(
        (subValue) => subValue === null || subValue === undefined
      ).length;
      if (emptyValueCount === Object.values(value[0] ?? value).length) {
        object[key] = [];
        return;
      }
    }
    if (typeof value === 'object' && !(value instanceof Date) && value !== null) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        value.forEach((subValue) => removeSingleSubEntitiesWithNullPropertiesInObject(subValue));
      } else {
        removeSingleSubEntitiesWithNullPropertiesInObject(value);
      }
    }
  });
}

function removeUndefinedIds(object: any) {
  Object.entries(object).forEach(([key, value]) => {
    if (key === 'id' && value === undefined) {
      delete object[key];
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        value.forEach((subValue) => removeUndefinedIds(subValue));
      } else {
        removeUndefinedIds(value);
      }
    }
  });
}

export default function removeSingleSubEntitiesWithNullProperties(rows: any[]) {
  rows.forEach((row) => {
    removeSingleSubEntitiesWithNullPropertiesInObject(row);
  });

  if (rows.length > 0) {
    removeUndefinedIds(rows[0]);
  }
}
