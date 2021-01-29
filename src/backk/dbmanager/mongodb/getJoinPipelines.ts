import entityAnnotationContainer from "../../decorators/entity/entityAnnotationContainer";

export default function getJoinPipelines(EntityClass: Function, Types: object) {
  let joinPipelines: any[] = [];

  if (entityAnnotationContainer.entityNameToJoinsMap[EntityClass.name]) {
    joinPipelines = entityAnnotationContainer.entityNameToJoinsMap[EntityClass.name]
      .map((joinSpec) => {
        return [
          { $addFields: { entityIdFieldNameAsString: { $toString: `$${joinSpec.entityIdFieldName}` } } },
          {
            $lookup: {
              from: joinSpec.subEntityTableName,
              localField: 'entityIdFieldNameAsString',
              foreignField: joinSpec.subEntityForeignIdFieldName,
              as: joinSpec.asFieldName
            }
          }
        ];
      })
      .flat();
  }

  /* const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  Object.entries(entityMetadata).forEach(([, fieldTypeName]: [any, any]) => {
    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      const subEntityJoinPipelines = getJoinPipelines((Types as any)[baseTypeName], Types);
      if (subEntityJoinPipelines !== undefined) {
        joinPipelines = joinPipelines.concat(subEntityJoinPipelines);
      }
    }
  }); */

  return joinPipelines;
}
