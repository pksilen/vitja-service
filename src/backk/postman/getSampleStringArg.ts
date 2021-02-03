import RandExp from 'randexp';
import {
  doesClassPropertyContainCustomValidation,
  getPropertyValidationOfType
} from "../validation/setClassPropertyValidationDecorators";
import getValidationConstraint from '../validation/getValidationConstraint';
import getCustomValidationConstraint from "../validation/getCustomValidationConstraint";

const classAndPropertyNameToSampleStringMap: { [key: string]: string } = {}

export default function getSampleStringArg(Class: Function, propertyName: string, isUpdate: boolean): string {
  const booleanStringValidation = getPropertyValidationOfType(Class, propertyName, 'isBooleanString');

  if (booleanStringValidation) {
    return isUpdate ? 'false' : 'true';
  }

  const containsValidation = getPropertyValidationOfType(Class, propertyName, 'contains');
  const containsValidationConstraint = getValidationConstraint(Class, propertyName, 'contains');

  if (containsValidation) {
    return containsValidationConstraint;
  }

  const bicValidation = getPropertyValidationOfType(Class, propertyName, 'isBIC');

  if (bicValidation) {
    return 'NDEAFIHH';
  }

  const base32Validation = getPropertyValidationOfType(Class, propertyName, 'isBase32');

  if (base32Validation) {
    return isUpdate ? 'ABCD' : 'ABC';
  }

  const btcAddressValidation = getPropertyValidationOfType(Class, propertyName, 'isBtcAddress');

  if (btcAddressValidation) {
    return '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
  }

  const creditCardValidation = getPropertyValidationOfType(Class, propertyName, 'isCreditCard');

  if (creditCardValidation) {
    return '4111 1111 1111 1111';
  }

  const dataUriValidation = getPropertyValidationOfType(Class, propertyName, 'isDataURI');

  if (dataUriValidation) {
    return 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==';
  }

  const dateStringValidation = getPropertyValidationOfType(Class, propertyName, 'isDateString');

  if (dateStringValidation) {
    return '2011-10-05T14:48:00.000Z';
  }

  const eanValidation = getPropertyValidationOfType(Class, propertyName, 'isEAN');

  if (eanValidation) {
    return '0049720026679';
  }

  const emailValidation = getPropertyValidationOfType(Class, propertyName, 'isEmail');

  if (emailValidation) {
    return 'test@test.com';
  }

  const ethereumAddressValidation = getPropertyValidationOfType(Class, propertyName, 'isEthereumAddress');

  if (ethereumAddressValidation) {
    return '0xb794f5ea0ba39494ce839613fffba74279579268';
  }

  const fqdnValidation = getPropertyValidationOfType(Class, propertyName, 'isFqdn');

  if (fqdnValidation) {
    return 'www.domain.com';
  }

  const hslValidation = getPropertyValidationOfType(Class, propertyName, 'isHSL');

  if (hslValidation) {
    return 'hsl(120,100%,50%)';
  }

  const hexColorValidation = getPropertyValidationOfType(Class, propertyName, 'isHexColor');

  if (hexColorValidation) {
    return '#ffffff';
  }

  const hexadecimalNumberValidation = getPropertyValidationOfType(Class, propertyName, 'isHexadecimal');

  if (hexadecimalNumberValidation) {
    return '0xff';
  }

  const ibanValidation = getPropertyValidationOfType(Class, propertyName, 'isIBAN');

  if (ibanValidation) {
    return 'FI211235600000785';
  }

  const ipValidation = getPropertyValidationOfType(Class, propertyName, 'isIp');
  let ipValidationConstraint = getValidationConstraint(Class, propertyName, 'isIp');

  if (typeof ipValidationConstraint === 'string') {
    ipValidationConstraint = parseInt(ipValidationConstraint, 10);
  }

  if (ipValidation) {
    return ipValidationConstraint === 4 ? '127.0.0.1' : '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
  }

  const isbnValidation = getPropertyValidationOfType(Class, propertyName, 'isIsbn');
  let isbnValidationConstraint = getValidationConstraint(Class, propertyName, 'isIsbn');

  if (typeof isbnValidationConstraint === 'string') {
    isbnValidationConstraint = parseInt(isbnValidationConstraint, 10);
  }

  if (isbnValidation) {
    return isbnValidationConstraint === 10 ? '0-306-40615-2' : '978-3-16-148410-0';
  }

  const isinValidation = getPropertyValidationOfType(Class, propertyName, 'isIsin');

  if (isinValidation) {
    return 'US0378331005';
  }

  const iso31661Alpha2inValidation = getPropertyValidationOfType(Class, propertyName, 'isISO31661Alpha2');

  if (iso31661Alpha2inValidation) {
    return 'FI';
  }

  const iso31661Alpha3inValidation = getPropertyValidationOfType(Class, propertyName, 'isISO31661Alpha3');

  if (iso31661Alpha3inValidation) {
    return 'FIN';
  }

  const iso8601Validation = getPropertyValidationOfType(Class, propertyName, 'isIso8601');

  if (iso8601Validation) {
    return '2011-10-05T14:48:00.000Z';
  }

  const isrcValidation = getPropertyValidationOfType(Class, propertyName, 'isISRC');

  if (isrcValidation) {
    return 'US-S1Z-99-00001';
  }

  const issnValidation = getPropertyValidationOfType(Class, propertyName, 'isISSN');

  if (issnValidation) {
    return '2049-3630';
  }

  const jsonValidation = getPropertyValidationOfType(Class, propertyName, 'isJson');

  if (jsonValidation) {
    return '{ "test": "test" }';
  }

  const jwtValidation = getPropertyValidationOfType(Class, propertyName, 'isJwt');

  if (jwtValidation) {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  }

  const localeValidation = getPropertyValidationOfType(Class, propertyName, 'isLocale');

  if (localeValidation) {
    return 'en-gb';
  }

  const macAddressValidation = getPropertyValidationOfType(Class, propertyName, 'isMacAddress');

  if (macAddressValidation) {
    return '06-00-00-00-00-00';
  }

  const magnetUriValidation = getPropertyValidationOfType(Class, propertyName, 'isMagnetURI');

  if (magnetUriValidation) {
    return 'magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a';
  }

  const militaryTimeValidation = getPropertyValidationOfType(Class, propertyName, 'isMilitaryTime');

  if (militaryTimeValidation) {
    return '13:00';
  }

  const mimeTypeValidation = getPropertyValidationOfType(Class, propertyName, 'isMimeType');

  if (mimeTypeValidation) {
    return 'application/json';
  }

  const numberStringValidation = getPropertyValidationOfType(Class, propertyName, 'isNumberString');

  if (numberStringValidation) {
    return isUpdate ? '1234' : '123';
  }

  const octalNumberValidation = getPropertyValidationOfType(Class, propertyName, 'isOctal');

  if (octalNumberValidation) {
    return isUpdate ? '01234' : '0123';
  }

  const portNumberValidation = getPropertyValidationOfType(Class, propertyName, 'isPort');

  if (portNumberValidation) {
    return '8080';
  }

  const rgbColorValidation = getPropertyValidationOfType(Class, propertyName, 'isRgbColor');

  if (rgbColorValidation) {
    return 'rgb(128,128,128)';
  }

  const semVerValidation = getPropertyValidationOfType(Class, propertyName, 'isSemVer');

  if (semVerValidation) {
    return '1.2.3';
  }

  const uuidValidation = getPropertyValidationOfType(Class, propertyName, 'isUuid');
  let uuidValidationConstraint = getValidationConstraint(Class, propertyName, 'isUuid');

  if (typeof uuidValidationConstraint === 'string') {
    uuidValidationConstraint = parseInt(uuidValidationConstraint, 10);
  }

  if (uuidValidation) {
    if (uuidValidationConstraint === 3) {
      return '6fa459ea-ee8a-3ca4-894e-db77e160355e';
    } else if (uuidValidationConstraint === 4) {
      return '16fd2706-8baf-433b-82eb-8c7fada847da';
    } else if (uuidValidationConstraint === 5) {
      return '886313e1-3b8a-5372-9b90-0c9aee199e5d';
    }
  }

  const upperCaseValidation = getPropertyValidationOfType(Class, propertyName, 'isUppercase');

  if (upperCaseValidation) {
    return isUpdate ? 'ABCD' : 'ABC';
  }

  const urlValidation = getPropertyValidationOfType(Class, propertyName, 'isUrl');

  if (urlValidation) {
    return 'https://www.google.com';
  }

  const notContainsValidation = getPropertyValidationOfType(Class, propertyName, 'notContains');
  const notContainsValidationConstraint: string = getValidationConstraint(Class, propertyName, 'notContains');

  if (notContainsValidation) {
    return notContainsValidationConstraint
      .split('')
      .map((character) =>
        'abcdefghijklmnopqrstuvwxyz'.split('').find((differentCharacter) => differentCharacter !== character)
      )
      .join('');
  }

  const matchesValidation = getPropertyValidationOfType(Class, propertyName, 'matches');
  const matchesValidationConstraint: RegExp = getValidationConstraint(Class, propertyName, 'matches');

  if (matchesValidation) {
    if (classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`]) {
      return classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`]
    }

    const randomRegExp = new RandExp(matchesValidationConstraint);
    randomRegExp.max = 10;
    const sampleString = randomRegExp.gen();
    classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`] = sampleString;
    return sampleString;
  }

  const hasLengthAndMatchesValiation = doesClassPropertyContainCustomValidation(Class, propertyName, 'lengthAndMatches');
  const maxLengthConstraint = getCustomValidationConstraint(Class, propertyName, 'lengthAndMatches', 2)
  const regExpConstraint = getCustomValidationConstraint(Class, propertyName, 'lengthAndMatches', 3)

  if (hasLengthAndMatchesValiation) {
    if (classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`]) {
      return classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`]
    }

    const randomRegExp = new RandExp(regExpConstraint);
    randomRegExp.max = 10;
    const sampleString = randomRegExp.gen().slice(0, maxLengthConstraint);
    classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`] = sampleString;
    return sampleString;
  }

  const hasMaxLengthAndMatchesValiation = doesClassPropertyContainCustomValidation(Class, propertyName, 'maxLengthAndMatches');

  if (hasMaxLengthAndMatchesValiation) {
    if (classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`]) {
      return classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`]
    }

    const maxLengthConstraint = getCustomValidationConstraint(Class, propertyName, 'maxLengthAndMatches', 1)
    const regExpConstraint = getCustomValidationConstraint(Class, propertyName, 'maxLengthAndMatches', 2)
    const randomRegExp = new RandExp(regExpConstraint);
    randomRegExp.max = 10;
    const sampleString = randomRegExp.gen().slice(0, maxLengthConstraint);
    classAndPropertyNameToSampleStringMap[`${Class.name}_${propertyName}`] = sampleString;
    return sampleString;
  }

  return isUpdate ? 'abcd' : 'abc';
}
