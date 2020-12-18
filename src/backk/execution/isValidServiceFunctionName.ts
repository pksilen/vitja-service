export default function isValidServiceFunctionName(serviceFunctionName: string, controller: any) {
  const [serviceName, functionName] = serviceFunctionName.split('.');

  if (!controller[serviceName]) {
   return false;
  }

  const serviceFunctionResponseValueTypeName =
    controller[`${serviceName}Types`].functionNameToReturnTypeNameMap[functionName];

  if (!controller[serviceName][functionName] || !serviceFunctionResponseValueTypeName) {
    return false;
  }

  return true;
}
