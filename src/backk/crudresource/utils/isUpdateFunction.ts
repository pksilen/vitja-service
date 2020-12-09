import serviceFunctionAnnotationContainer from '../../decorators/service/function/serviceFunctionAnnotationContainer';

export default function isUpdateFunction(serviceClass: Function, functionName: string) {
  const returnVal = (
    functionName.startsWith('update') ||
    functionName.startsWith('modify') ||
    functionName.startsWith('change') ||
    functionName.startsWith('patch') ||
    serviceFunctionAnnotationContainer.isUpdateServiceFunction(serviceClass, functionName)
  );

  return returnVal;
}
