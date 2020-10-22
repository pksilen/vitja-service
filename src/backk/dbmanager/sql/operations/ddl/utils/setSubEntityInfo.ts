import entityAnnotationContainer from '../../../../../decorators/entity/entityAnnotationContainer';

export default function setSubEntityInfo(entityName: string, baseFieldTypeName: string) {
  const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
  const relationEntityName = baseFieldTypeName;
  if (entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap[relationEntityName]) {
    entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap[relationEntityName].push(idFieldName);
  } else {
    entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap[relationEntityName] = [idFieldName];
  }
  const joinSpec = {
    joinTableName: relationEntityName,
    fieldName: '_id',
    joinTableFieldName: idFieldName
  };
  if (entityAnnotationContainer.entityNameToJoinsMap[entityName]) {
    entityAnnotationContainer.entityNameToJoinsMap[entityName].push(joinSpec);
  } else {
    entityAnnotationContainer.entityNameToJoinsMap[entityName] = [joinSpec];
  }
}
