import isCreateFunction from './utils/isCreateFunction';
import isReadFunction from './utils/isReadFunction';
import isUpdateFunction from './utils/isUpdateFunction';
import isDeleteFunction from './utils/isDeleteFunction';

export default function assertFunctionNamesAreValidForCrudResourceService(
  serviceClass: Function,
  functionNames: string[]
) {
  return functionNames.forEach((functionName) => {
    if (
      !isCreateFunction(functionName) &&
      !isReadFunction(serviceClass, functionName) &&
      !isUpdateFunction(serviceClass, functionName) &&
      !isDeleteFunction(serviceClass, functionName)
    ) {
      throw new Error(
        'Invalid function name: ' +
          serviceClass.name +
          '.' +
          functionName +
          `\n
      Follow CrudResourceService naming conventions:
      - Create function names must start with create, add or insert
      - Read function names must start with get, read, find, fetch, retrieve, obtain
      - Update function names must start with update, modify, change, patch
      - Delete function names must start with delete, remove, erase, destroy
      Alternatively, annotate functions with one of following: @Create(), @Read(), @Update(), @Delete()
      `
      );
    }
  });
}
