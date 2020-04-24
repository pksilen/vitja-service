import entityContainer from "./entityContainer";

export default function Entity(entityClass: Function) {
  entityContainer.addEntityNameAndClass(entityClass.name, entityClass);
}
