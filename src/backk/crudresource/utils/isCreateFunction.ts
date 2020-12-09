export default function isCreateFunction(serviceClass: Function, functionName: string) {
  return (
    functionName.startsWith('create') || functionName.startsWith('add') || functionName.startsWith('insert')
  );
}
