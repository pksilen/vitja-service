import entityAnnotationContainer, {
  EntityJoinSpec, ManyToManyRelationTableSpec
} from "../../../../../decorators/entity/entityAnnotationContainer";
import typePropertyAnnotationContainer from '../../../../../decorators/typeproperty/typePropertyAnnotationContainer';

export default function setSubEntityInfo(
  entityName: string,
  EntityClass: Function,
  fieldName: string,
  subEntityName: string
) {
  if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
    const manyToManyRelationTableSpec: ManyToManyRelationTableSpec = {
      tableName: entityName + '_' + subEntityName,
      entityForeignIdFieldName: entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id',
      subEntityForeignIdFieldName: subEntityName.charAt(0).toLowerCase() + subEntityName.slice(1) + 'Id'
    }

    entityAnnotationContainer.manyToManyRelationTableSpecs.push(manyToManyRelationTableSpec);
  } else {
    const subEntityForeignIdFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';

    if (entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap[subEntityName]) {
      entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap[subEntityName].push(
        subEntityForeignIdFieldName
      );
    } else {
      entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap[subEntityName] = [
        subEntityForeignIdFieldName
      ];
    }

    const entityJoinSpec: EntityJoinSpec = {
      subEntityTableName: subEntityName,
      entityIdFieldName: '_id',
      subEntityForeignIdFieldName
    };

    if (entityAnnotationContainer.entityNameToJoinsMap[entityName]) {
      entityAnnotationContainer.entityNameToJoinsMap[entityName].push(entityJoinSpec);
    } else {
      entityAnnotationContainer.entityNameToJoinsMap[entityName] = [entityJoinSpec];
    }
  }
}
