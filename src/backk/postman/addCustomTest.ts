import _ from 'lodash';
import createPostmanCollectionItemFromCustomTest from './createPostmanCollectionItemFromCustomTest';

export default function addCustomTest(writtenTest: any, items: any[]) {
  if (writtenTest.tests) {
    writtenTest.tests.forEach((test: any) => {
      const instantiatedWrittenTest = _.cloneDeepWith(writtenTest, (value: any) => {
        let replacedValue = value;
        Object.entries(test.testProperties || {}).forEach(
          ([testPropertyName, testPropertyValue]: [string, any]) => {
            if (replacedValue === `{{${testPropertyName}}}`) {
              replacedValue = testPropertyValue;
            }
            if (typeof replacedValue === 'string' && replacedValue.includes(`{{${testPropertyName}}}`)) {
              replacedValue = replacedValue.replace(`{{${testPropertyName}}}`, testPropertyValue);
            }
          }
        );
        return replacedValue === value ? undefined : replacedValue;
      });

      Object.keys(instantiatedWrittenTest.testTemplate.functionArgument || {}).forEach(
        (argumentKey: string) => {
          let isArgumentTemplateReplaced = false;

          Object.entries(test.testProperties || {}).forEach(([key, value]: [string, any]) => {
            if (argumentKey === `{{${key}}}`) {
              const argumentValue = instantiatedWrittenTest.testTemplate.functionArgument[argumentKey];
              delete instantiatedWrittenTest.testTemplate.functionArgument[argumentKey];
              instantiatedWrittenTest.testTemplate.functionArgument[value] = argumentValue;
              isArgumentTemplateReplaced = true;
            }
          });

          if (!isArgumentTemplateReplaced && argumentKey.startsWith('{{') && argumentKey.endsWith('}}')) {
            delete instantiatedWrittenTest.testTemplate.functionArgument[argumentKey];
          }
        }
      );

      instantiatedWrittenTest.testTemplate.testTemplateName =
        instantiatedWrittenTest.testTemplate.serviceName +
        '.' +
        instantiatedWrittenTest.testTemplate.functionName +
        (test.testName ? ' (' + test.testName + ')' : '');

      items.push(createPostmanCollectionItemFromCustomTest(instantiatedWrittenTest));
    });
  } else {
    items.push(createPostmanCollectionItemFromCustomTest(writtenTest));
  }
}
