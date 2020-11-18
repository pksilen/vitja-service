export default function isMutatingServiceFunction(serviceFunction: string): boolean {
  if (
    serviceFunction.startsWith('get') ||
    serviceFunction.startsWith('find') ||
    serviceFunction.startsWith('read') ||
    serviceFunction.startsWith('fetch') ||
    serviceFunction.startsWith('retrieve') ||
    serviceFunction.startsWith('obtain')
  ) {
    return false;
  }

  return true;
}
