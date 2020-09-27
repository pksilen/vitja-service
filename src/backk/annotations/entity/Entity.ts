import entityContainer from "./entityContainer";

export default function Entity() {
  return function(entityClass: Function) {
    entityContainer.addEntityNameAndClass(entityClass.name, entityClass);
  }
}
