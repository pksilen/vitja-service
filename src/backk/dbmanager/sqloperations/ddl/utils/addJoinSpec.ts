import entityAnnotationContainer from '../../../../annotations/entity/entityAnnotationContainer';

export default function addJoinSpec(entityName: string, fieldName: string, idFieldName: string) {
  const joinSpec = {
    joinTableName: entityName + fieldName.slice(0, -1),
    fieldName: '_id',
    joinTableFieldName: idFieldName
  };

  if (entityAnnotationContainer.entityNameToJoinsMap[entityName]) {
    entityAnnotationContainer.entityNameToJoinsMap[entityName].push(joinSpec);
  } else {
    entityAnnotationContainer.entityNameToJoinsMap[entityName] = [joinSpec];
  }
}
