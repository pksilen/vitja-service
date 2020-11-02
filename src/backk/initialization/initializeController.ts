import BaseService from '../service/BaseService';
import generateServicesMetadata from '../metadata/generateServicesMetadata';
import parseServiceTypeNames from '../parser/parseServiceTypeNames';
import getSrcFilePathNameForTypeName from '../utils/file/getSrcFilePathNameForTypeName';
import setPropertyTypeValidationDecorators from '../validation/setPropertyTypeValidationDecorators';
import setNestedTypeValidationDecorators from '../validation/setNestedTypeValidationDecorators';
import writeTestsPostmanCollectionExportFile from '../postman/writeTestsPostmanCollectionExportFile';
import writeApiPostmanCollectionExportFile from "../postman/writeApiPostmanCollectionExportFile";

export interface ControllerInitOptions {
  generatePostmanTestFile?: boolean;
  generatePostmanApiFile?: boolean;
}

export default function initializeController(controller: any, controllerInitOptions?: ControllerInitOptions) {
  Object.entries(controller)
    .filter(([, service]: [string, any]) => service instanceof BaseService)
    .forEach(([serviceName]: [string, any]) => {
      if (serviceName === 'metadataService') {
        throw new Error('metadataService is a reserved internal service name.');
      } else if (serviceName === 'livenessCheckService') {
        throw new Error('livenessCheckService is a reserved internal service name.');
      }

      const [functionNameToParamTypeNameMap, functionNameToReturnTypeNameMap] = parseServiceTypeNames(
        serviceName,
        getSrcFilePathNameForTypeName(serviceName.charAt(0).toUpperCase() + serviceName.slice(1))
      );

      controller[`${serviceName}Types`] = {
        functionNameToParamTypeNameMap,
        functionNameToReturnTypeNameMap
      };
    });

  generateServicesMetadata(controller, true);

  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object' && value.constructor !== Object)
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      Object.entries(controller[serviceName].Types ?? {}).forEach(([, typeClass]: [string, any]) => {
        setPropertyTypeValidationDecorators(typeClass, serviceName, controller[serviceName].Types);
        setNestedTypeValidationDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
      }, {});
    });

  const servicesMetadata = generateServicesMetadata(controller, false);
  controller.servicesMetadata = servicesMetadata;

  if (process.env.NODE_ENV === 'development' && (controllerInitOptions?.generatePostmanTestFile ?? true)) {
    writeTestsPostmanCollectionExportFile(controller, servicesMetadata);
  }
  if (process.env.NODE_ENV === 'development' && (controllerInitOptions?.generatePostmanApiFile ?? true)) {
    writeApiPostmanCollectionExportFile(controller, servicesMetadata);
  }
}