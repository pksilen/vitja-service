export default function getReturnValueBaseTypeName(returnValueTypeName: string) {
  const returnValueBaseTypeName = returnValueTypeName.split('|')[0].trim();
  if (returnValueBaseTypeName.endsWith('[]')) {
    return returnValueBaseTypeName.slice(0, -2);
  }
  return returnValueBaseTypeName;
}
