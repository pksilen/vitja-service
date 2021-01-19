import entityAnnotationContainer, {
  EntityJoinSpec, ManyToManyRelationTableSpec
} from "../../../../../decorators/entity/entityAnnotationContainer";
import typePropertyAnnotationContainer from '../../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import { doesClassPropertyContainCustomValidation } from "../../../../../validation/setClassPropertyValidationDecorators";

export default function setSubEntityInfo(
  entityName: string,
  EntityClass: Function,
  fieldName: string,
  subEntityName: string,
  isArrayType: boolean
) {
  if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
    const manyToManyRelationTableSpec: ManyToManyRelationTableSpec = {
      entityFieldName: fieldName,
      associationTableName: (entityName + '_' + subEntityName).toLowerCase(),
      entityForeignIdFieldName: entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id',
      subEntityForeignIdFieldName: subEntityName.charAt(0).toLowerCase() + subEntityName.slice(1) + 'Id'
    }

    entityAnnotationContainer.manyToManyRelationTableSpecs.push(manyToManyRelationTableSpec);
  } else {
    const subEntityForeignIdFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';

    if (entityAnnotationContainer.entityNameToForeignIdFieldNamesMap[subEntityName]) {
      entityAnnotationContainer.entityNameToForeignIdFieldNamesMap[subEntityName].push(
        subEntityForeignIdFieldName
      );
    } else {
      entityAnnotationContainer.entityNameToForeignIdFieldNamesMap[subEntityName] = [
        subEntityForeignIdFieldName
      ];
    }

    entityAnnotationContainer.entityNameToIsArrayMap[subEntityName] = isArrayType;

    const isReadonly = doesClassPropertyContainCustomValidation(EntityClass, fieldName, 'isUndefined');

    const entityJoinSpec: EntityJoinSpec = {
      entityFieldName: fieldName,
      subEntityTableName: subEntityName.toLowerCase(),
      entityIdFieldName: '_id',
      subEntityForeignIdFieldName,
      isReadonly
    };

    if (entityAnnotationContainer.entityNameToJoinsMap[entityName]) {
      entityAnnotationContainer.entityNameToJoinsMap[entityName].push(entityJoinSpec);
    } else {
      entityAnnotationContainer.entityNameToJoinsMap[entityName] = [entityJoinSpec];
    }
  }
}
