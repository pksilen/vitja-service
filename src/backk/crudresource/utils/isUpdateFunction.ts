import serviceFunctionAnnotationContainer from '../../decorators/service/function/serviceFunctionAnnotationContainer';

export default function isUpdateFunction(serviceClass: Function, functionName: string) {
  return (
    functionName.startsWith('update') ||
    functionName.startsWith('modify') ||
    functionName.startsWith('change') ||
    functionName.startsWith('patch') ||
    typeof serviceClass === 'function' && serviceFunctionAnnotationContainer.isUpdateServiceFunction(serviceClass, functionName)
  );
}
