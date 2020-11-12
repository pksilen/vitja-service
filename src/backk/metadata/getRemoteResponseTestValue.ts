import getTypeMetadata from './getTypeMetadata';
import testValueContainer from '../decorators/typeproperty/testing/testValueContainer';
import getValidationConstraint from '../validation/getValidationConstraint';

export default function getRemoteResponseTestValue<T>(
  ResponseClass: new () => T,
  types?: { [key: string]: new () => any }
) {
  const responseTypeProperties = getTypeMetadata(ResponseClass);
  const sampleArg: { [key: string]: any } = {};

  Object.entries(responseTypeProperties).forEach(([propertyName, propertyTypeName]: [string, string]) => {
    const isOptionalProperty = propertyTypeName.startsWith('?');
    let finalPropertyTypeName = isOptionalProperty ? propertyTypeName.slice(1) : propertyTypeName;

    const propertyTypeNameAndDefaultValue = finalPropertyTypeName.split(' = ');
    // noinspection ReuseOfLocalVariableJS
    finalPropertyTypeName = propertyTypeNameAndDefaultValue[0];
    const defaultValue = propertyTypeNameAndDefaultValue[1];
    if (isOptionalProperty && defaultValue === undefined) {
      return;
    }

    const finalPropertyTypeNameWithoutArraySuffix = finalPropertyTypeName.endsWith('[]')
      ? finalPropertyTypeName.slice(0, -2)
      : finalPropertyTypeName;

    const testValue = testValueContainer.getTestValue(ResponseClass, propertyName);
    const minValue = getValidationConstraint(ResponseClass, propertyName, 'min');

    if (testValue !== undefined) {
      sampleArg[propertyName] = testValue;
    } else if (propertyName === '_id' || propertyName === 'id' || propertyName.endsWith('Id')) {
      sampleArg[propertyName] = '0';
    } else if (finalPropertyTypeName.startsWith('integer') || finalPropertyTypeName.startsWith('bigint')) {
      sampleArg[propertyName] = minValue;
    } else if (finalPropertyTypeName.startsWith('number')) {
      sampleArg[propertyName] = parseFloat(minValue.toFixed(2));
    } else if (finalPropertyTypeName.startsWith('boolean')) {
      sampleArg[propertyName] = true;
    } else if (finalPropertyTypeName.startsWith('string')) {
      sampleArg[propertyName] = 'abc';
    } else if (finalPropertyTypeName.startsWith('Date')) {
      sampleArg[propertyName] = new Date(0).toString();
    } else if (finalPropertyTypeName.startsWith('(')) {
      const enumValues = finalPropertyTypeName.slice(1).split(/[|)]/);
      sampleArg[propertyName] =
        enumValues[0][0] === "'"
          ? enumValues[0].split("'")[1]
          : enumValues[0].includes('.')
          ? parseFloat(enumValues[0])
          : parseInt(enumValues[0]);
    } else if (types?.[propertyName]) {
      sampleArg[propertyName] = getRemoteResponseTestValue(types?.[propertyName]);
    }

    if (finalPropertyTypeName.endsWith('[]')) {
      if (propertyName.endsWith('Ids') && testValue === undefined) {
        sampleArg[propertyName] = ['0'];
      } else {
        sampleArg[propertyName] =
          defaultValue === undefined ? [sampleArg[propertyName]] : JSON.parse(defaultValue);
      }
    }
  });

  return sampleArg;
}
