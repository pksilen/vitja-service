import getPropertyNameToPropertyTypeNameMap from './getPropertyNameToPropertyTypeNameMap';
import testValueContainer from '../decorators/typeproperty/testing/testValueContainer';
import getValidationConstraint from '../validation/getValidationConstraint';
import getTypeInfoFromMetadataTypeName from '../utils/type/getTypeInfoFromMetadataTypeName';

export default function getRemoteResponseTestValue<T>(
  ResponseClass: new () => T,
  types?: { [key: string]: new () => any }
) {
  const sampleArg: { [key: string]: any } = {};

  Object.entries(getPropertyNameToPropertyTypeNameMap(ResponseClass)).forEach(
    ([propertyName, propertyTypeName]: [string, string]) => {
      const { baseTypeName, defaultValueStr, isOptionalType } = getTypeInfoFromMetadataTypeName(propertyTypeName);
      if (isOptionalType && defaultValueStr === undefined) {
        return;
      }

      const testValue = testValueContainer.getTestValue(ResponseClass, propertyName);
      const minValue = getValidationConstraint(ResponseClass, propertyName, 'min');

      if (testValue !== undefined) {
        sampleArg[propertyName] = testValue;
      } else if (propertyName === '_id' || propertyName === 'id' || propertyName.endsWith('Id')) {
        sampleArg[propertyName] = '0';
      } else if (baseTypeName.startsWith('integer') || baseTypeName.startsWith('bigint')) {
        sampleArg[propertyName] = minValue;
      } else if (baseTypeName.startsWith('number')) {
        sampleArg[propertyName] = parseFloat(minValue.toFixed(2));
      } else if (baseTypeName.startsWith('boolean')) {
        sampleArg[propertyName] = true;
      } else if (baseTypeName.startsWith('string')) {
        sampleArg[propertyName] = 'abc';
      } else if (baseTypeName.startsWith('Date')) {
        sampleArg[propertyName] = `'${new Date(0).toISOString()}'`;
      } else if (baseTypeName.startsWith('(')) {
        const enumValues = baseTypeName.slice(1).split(/[|)]/);
        sampleArg[propertyName] =
          enumValues[0][0] === "'"
            ? enumValues[0].split("'")[1]
            : enumValues[0].includes('.')
            ? parseFloat(enumValues[0])
            : parseInt(enumValues[0]);
      } else if (types?.[propertyName]) {
        sampleArg[propertyName] = getRemoteResponseTestValue(types?.[propertyName]);
      }

      if (baseTypeName.endsWith('[]')) {
        if (propertyName.endsWith('Ids') && testValue === undefined) {
          sampleArg[propertyName] = ['0'];
        } else {
          sampleArg[propertyName] =
            defaultValueStr === undefined ? [sampleArg[propertyName]] : JSON.parse(defaultValueStr);
        }
      }
    }
  );

  return sampleArg;
}
