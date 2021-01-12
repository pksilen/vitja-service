import entityAnnotationContainer from '../../decorators/entity/entityAnnotationContainer';
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../utils/type/isEntityTypeName';

export default function getJoinPipelines(EntityClass: Function, Types: object) {
  let joinPipelines: any[] = [];

  if (entityAnnotationContainer.entityNameToJoinsMap[EntityClass.name]) {
    joinPipelines = entityAnnotationContainer.entityNameToJoinsMap[EntityClass.name].map((joinSpec) => {
      return {
        $lookup: {
          from: joinSpec.subEntityTableName,
          localField: joinSpec.entityIdFieldName,
          foreignField: joinSpec.subEntityForeignIdFieldName,
          as: joinSpec.asFieldName
        }
      };
    });
  }

  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  Object.entries(entityMetadata).forEach(([, fieldTypeName]: [any, any]) => {
    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      const subEntityJoinPipelines = getJoinPipelines((Types as any)[baseTypeName], Types);
      if (subEntityJoinPipelines !== undefined) {
        joinPipelines = joinPipelines.concat(subEntityJoinPipelines);
      }
    }
  });

  return joinPipelines;
}
