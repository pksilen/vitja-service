export default function isDeleteFunction(serviceClass: Function, functionName: string) {
  return (
    functionName.startsWith('delete') ||
    functionName.startsWith('remove') ||
    functionName.startsWith('erase') ||
    functionName.startsWith('destroy')
  );
}
