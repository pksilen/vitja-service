import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import { HttpStatusCodes } from "../constants/constants";

export default function tryValidateIntegrationTests(
  integrationTests: any[],
  servicesMetadata: ServiceMetadata[]
) {
  integrationTests.forEach((integrationTest) => {
    if (!integrationTest.testTemplate) {
      throw new Error('Integration tests: Missing testTemplate specification');
    }

    const foundInvalidKey = Object.keys(integrationTest.testTemplate).find(
      (key) =>
        key !== 'executeAfter' &&
        key !== 'executeBefore' &&
        key !== 'serviceFunctionName' &&
        key !== 'argument' &&
        key !== 'response'
    );

    if (foundInvalidKey) {
      throw new Error("Integration tests: Invalid key '" + foundInvalidKey + "' in testTemplate");
    }

    if (!integrationTest.testTemplate.response || !integrationTest.testTemplate.response.statusCode) {
      integrationTest.testTemplate.response = {
        statusCode: HttpStatusCodes.SUCCESS,
        ...(integrationTest.testTemplate.response ?? {})
      };
    }

    const foundInvalidResponseKey = Object.keys(integrationTest.testTemplate.response).find(
      (key) =>
        key !== 'statusCode' &&
        key !== 'tests'
    );

    if (foundInvalidResponseKey) {
      throw new Error("Integration tests: Invalid key '" + foundInvalidResponseKey + "' in testTemplate.response");
    }
    
    if (integrationTest.tests) {
      integrationTest.tests.forEach((test: any) => {
        const foundInvalidKey = Object.keys(test).find(
          (key) => key !== 'testName' && key !== 'testProperties'
        );

        if (foundInvalidKey) {
          throw new Error("Integration tests: Invalid key '" + foundInvalidKey + "' in tests");
        }
      });
    }

    if (integrationTest.testTemplate.executeBefore) {
      const [serviceName, functionName] = integrationTest.testTemplate.executeBefore.split('.');

      const serviceMetadata = servicesMetadata.find(
        (serviceMetadata) => serviceMetadata.serviceName === serviceName
      );

      const functionMetadata = serviceMetadata?.functions.find((func) => func.functionName === functionName);

      if (!serviceMetadata || !functionMetadata) {
        throw new Error(
          'Integration tests: unknown executeBefore: ' + integrationTest.testTemplate.executeBefore
        );
      }
    }

    if (integrationTest.testTemplate.executeAfter) {
      const [serviceName, functionName] = integrationTest.testTemplate.executeAfter.split('.');

      const serviceMetadata = servicesMetadata.find(
        (serviceMetadata) => serviceMetadata.serviceName === serviceName
      );

      const functionMetadata = serviceMetadata?.functions.find((func) => func.functionName === functionName);

      if (!serviceMetadata || !functionMetadata) {
        throw new Error(
          'Integration tests: unknown executeAfter: ' + integrationTest.testTemplate.executeAfter
        );
      }
    }
  });
}
