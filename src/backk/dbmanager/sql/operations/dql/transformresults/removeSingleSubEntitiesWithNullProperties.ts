function removeSingleSubEntitiesWithNullPropertiesInObject(object: any) {
  Object.entries(object).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length === 1 && typeof value[0] === 'object') {
      const emptyValueCount = Object.values(value[0]).filter(
        (subValue) => subValue === null || subValue === undefined
      ).length;
      if (emptyValueCount === Object.values(value[0]).length) {
        object[key] = [];
        return;
      }
    }
    if (typeof value === 'object') {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        value.forEach((subValue) => removeSingleSubEntitiesWithNullPropertiesInObject(subValue));
      } else {
        removeSingleSubEntitiesWithNullPropertiesInObject(value);
      }
    }
  });
}

export default function removeSingleSubEntitiesWithNullProperties(rows: any[]) {
  rows.forEach((row) => {
    removeSingleSubEntitiesWithNullPropertiesInObject(rows);
  });
}
