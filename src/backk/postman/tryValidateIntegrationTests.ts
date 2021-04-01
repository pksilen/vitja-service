import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import { HttpStatusCodes } from '../constants/constants';

export default function tryValidateIntegrationTests(
  integrationTests: any[],
  servicesMetadata: ServiceMetadata[]
) {
  integrationTests.forEach((integrationTest) => {
    if (!integrationTest.testTemplate) {
      if (integrationTest.test) {
        integrationTest.tests = [ { testName: integrationTest.name }];
        delete integrationTest.test.name;
        integrationTest.testTemplate = integrationTest.test;
      } else {
        throw new Error('Integration tests: Missing testTemplate or test specification');
      }
    }

    const foundInvalidKey = Object.keys(integrationTest.testTemplate).find(
      (key) =>
        key !== 'name' &&
        key !== 'after' &&
        key !== 'before' &&
        key !== 'serviceFunctionName' &&
        key !== 'argument' &&
        key !== 'response'
    );

    if (foundInvalidKey) {
      throw new Error("Integration tests: Invalid key '" + foundInvalidKey + "' in test or testTemplate");
    }

    if (integrationTest.testTemplate) {
      if (!integrationTest.testTemplate.response || !integrationTest.testTemplate.response.statusCode) {
        integrationTest.testTemplate.response = {
          statusCode: HttpStatusCodes.SUCCESS,
          ...(integrationTest.testTemplate.response ?? {})
        };
      }
    }

    const foundInvalidResponseKey = Object.keys(integrationTest.testTemplate.response).find(
      (key) => key !== 'statusCode' && key !== 'tests'
    );

    if (foundInvalidResponseKey) {
      throw new Error(
        "Integration tests: Invalid key '" + foundInvalidResponseKey + "' in testTemplate.response"
      );
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

    if (integrationTest.testTemplate.before) {
      const [serviceName, functionName] = integrationTest.testTemplate.before.split('.');

      const serviceMetadata = servicesMetadata.find(
        (serviceMetadata) => serviceMetadata.serviceName === serviceName
      );

      const functionMetadata = serviceMetadata?.functions.find((func) => func.functionName === functionName);

      if (!serviceMetadata || !functionMetadata) {
        throw new Error(
          'Integration tests: unknown before: ' + integrationTest.testTemplate.before
        );
      }
    }

    if (integrationTest.testTemplate.after) {
      const [serviceName, functionName] = integrationTest.testTemplate.after.split('.');

      const serviceMetadata = servicesMetadata.find(
        (serviceMetadata) => serviceMetadata.serviceName === serviceName
      );

      const functionMetadata = serviceMetadata?.functions.find((func) => func.functionName === functionName);

      if (!serviceMetadata || !functionMetadata) {
        throw new Error(
          'Integration tests: unknown after: ' + integrationTest.testTemplate.after
        );
      }
    }
  });
}
