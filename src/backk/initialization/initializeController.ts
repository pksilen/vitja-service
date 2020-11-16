import _ from 'lodash';
import BaseService from '../service/BaseService';
import generateServicesMetadata from '../metadata/generateServicesMetadata';
import parseServiceFunctionNameToArgAndReturnTypeNameMaps from '../parser/parseServiceFunctionNameToArgAndReturnTypeNameMaps';
import getSrcFilePathNameForTypeName from '../utils/file/getSrcFilePathNameForTypeName';
import setPropertyTypeValidationDecorators from '../validation/setPropertyTypeValidationDecorators';
import setNestedTypeValidationDecorators from '../validation/setNestedTypeValidationDecorators';
import writeTestsPostmanCollectionExportFile from '../postman/writeTestsPostmanCollectionExportFile';
import writeApiPostmanCollectionExportFile from '../postman/writeApiPostmanCollectionExportFile';

export interface ControllerInitOptions {
  generatePostmanTestFile?: boolean;
  generatePostmanApiFile?: boolean;
}

export default function initializeController(controller: any, controllerInitOptions?: ControllerInitOptions) {
  const serviceNameToServiceEntries = Object.entries(controller).filter(
    ([, service]: [string, any]) => service instanceof BaseService
  );

  const servicesUniqueByDbManager = _.uniqBy(
    serviceNameToServiceEntries,
    ([, service]: [string, any]) => service.getDbManager()
  );

  if (servicesUniqueByDbManager.length > 1) {
    throw new Error('Services can use only one same database manager');
  }

  serviceNameToServiceEntries.forEach(([serviceName]: [string, any]) => {
    if (serviceName === 'metadataService') {
      throw new Error('metadataService is a reserved internal service name.');
    } else if (serviceName === 'livenessCheckService') {
      throw new Error('livenessCheckService is a reserved internal service name.');
    }

    const [
      functionNameToParamTypeNameMap,
      functionNameToReturnTypeNameMap
    ] = parseServiceFunctionNameToArgAndReturnTypeNameMaps(
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
