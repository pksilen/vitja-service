import { getFileNamesRecursively } from './getSrcFilenameForTypeName';

export default function getTypeFilePathNameFor(typeName: string) {
  const filePathNames = getFileNamesRecursively(process.cwd() + '/src');
  return filePathNames.find((filePathName: string) => filePathName.endsWith('/' + typeName + '.type'));
}
