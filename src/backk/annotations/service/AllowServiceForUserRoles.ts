import serviceAnnotationContainer from "./serviceAnnotationContainer";

export default function AllowForUserRoles(roles: string[]) {
  return function(serviceClass: Function) {
    serviceAnnotationContainer.addAllowedUserRoles(serviceClass, roles);
  }
}
