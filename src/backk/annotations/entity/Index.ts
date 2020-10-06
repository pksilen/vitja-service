import entityContainer from './entityAnnotationContainer';

export default function Index(indexFields: string[]) {
  return function(entityClass: Function) {
    entityContainer.addEntityIndex(entityClass.name, indexFields);
  };
}
