export default function isCreateFunction(functionName: string) {
  return (
    functionName.startsWith('create') ||
    functionName.startsWith('add') ||
    functionName.startsWith('insert') ||
    functionName.startsWith('place')
  );
}
