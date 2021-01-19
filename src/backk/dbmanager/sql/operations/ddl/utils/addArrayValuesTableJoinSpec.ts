import entityAnnotationContainer, {
  EntityJoinSpec
} from '../../../../../decorators/entity/entityAnnotationContainer';

export default function addArrayValuesTableJoinSpec(
  entityName: string,
  fieldName: string,
  subEntityForeignIdFieldName: string
) {
  const entityJoinSpec: EntityJoinSpec = {
    entityFieldName: fieldName,
    subEntityTableName: entityName + '_' + fieldName.slice(0, -1),
    entityIdFieldName: '_id',
    subEntityForeignIdFieldName,
    isReadonly: false
  };

  if (entityAnnotationContainer.entityNameToJoinsMap[entityName]) {
    entityAnnotationContainer.entityNameToJoinsMap[entityName].push(entityJoinSpec);
  } else {
    entityAnnotationContainer.entityNameToJoinsMap[entityName] = [entityJoinSpec];
  }
}
