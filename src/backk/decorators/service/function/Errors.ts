import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';
import { ErrorCodeAndMessageAndStatus } from "../../../dbmanager/hooks/PreHook";

export function Errors(errors: ErrorCodeAndMessageAndStatus[]) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addErrorsForServiceFunction(
      object.constructor,
      functionName,
      errors
    );
  };
}
