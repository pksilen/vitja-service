import entityContainer from './entityAnnotationContainer';

export default function Entity() {
  return function(entityClass: Function) {
    entityContainer.addEntityNameAndClass(entityClass.name, entityClass);
  };
}
