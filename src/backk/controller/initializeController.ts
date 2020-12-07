import _ from 'lodash';
import BaseService from '../service/BaseService';
import generateServicesMetadata from '../metadata/generateServicesMetadata';
import parseServiceFunctionNameToArgAndReturnTypeNameMaps from '../typescript/parser/parseServiceFunctionNameToArgAndReturnTypeNameMaps';
import getSrcFilePathNameForTypeName from '../utils/file/getSrcFilePathNameForTypeName';
import setClassPropertyValidationDecorators from '../validation/setClassPropertyValidationDecorators';
import setNestedTypeValidationDecorators from '../validation/setNestedTypeValidationDecorators';
import writeTestsPostmanCollectionExportFile from '../postman/writeTestsPostmanCollectionExportFile';
import writeApiPostmanCollectionExportFile from '../postman/writeApiPostmanCollectionExportFile';
import generateTypesForServices from "../metadata/generateTypesForService";
import getNestedClasses from "../metadata/getNestedClasses";

export interface ControllerInitOptions {
  generatePostmanTestFile?: boolean;
  generatePostmanApiFile?: boolean;
}

export default function initializeController(controller: any, controllerInitOptions?: ControllerInitOptions) {
  const serviceNameToServiceEntries = Object.entries(controller).filter(
    ([, service]: [string, any]) => service instanceof BaseService
  );

  if (serviceNameToServiceEntries.length === 0) {
    throw new Error(controller.constructor + ': No services defined. Services must extend from BaseService.');
  }

  const servicesUniqueByDbManager = _.uniqBy(serviceNameToServiceEntries, ([, service]: [string, any]) =>
    service.getDbManager()
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

  generateTypesForServices(controller);

  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object' && value.constructor !== Object)
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      getNestedClasses(Object.keys(controller[serviceName].Types ?? {}), controller[serviceName].Types);
      Object.entries(controller[serviceName].Types ?? {}).forEach(([, typeClass]: [string, any]) => {
        setClassPropertyValidationDecorators(typeClass, serviceName, controller[serviceName].Types);
        setNestedTypeValidationDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
      }, {});
    });

  const servicesMetadata = generateServicesMetadata(controller);
  controller.servicesMetadata = servicesMetadata;
  controller.publicServicesMetadata = servicesMetadata.map((serviceMetadata) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      types, // NOSONAR
      publicTypes,
      serviceName,
      functions,
      validations,
      propertyModifiers,
      serviceDocumentation,
      typesDocumentation
    } = serviceMetadata;
    return {
      serviceName,
      serviceDocumentation,
      functions,
      types: publicTypes,
      propertyModifiers,
      typesDocumentation,
      validations
    };
  });

  if (process.env.NODE_ENV === 'development' && (controllerInitOptions?.generatePostmanTestFile ?? true)) {
    writeTestsPostmanCollectionExportFile(controller, servicesMetadata);
  }
  if (process.env.NODE_ENV === 'development' && (controllerInitOptions?.generatePostmanApiFile ?? true)) {
    writeApiPostmanCollectionExportFile(controller, servicesMetadata);
  }
}
