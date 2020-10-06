import entityContainer from './entityAnnotationContainer';

export default function UniqueIndex(indexFields: string[]) {
  return function(entityClass: Function) {
    entityContainer.addEntityUniqueIndex(entityClass.name, indexFields);
  };
}
