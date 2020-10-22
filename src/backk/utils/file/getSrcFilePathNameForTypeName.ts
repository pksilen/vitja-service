import { Dirent, readdirSync } from 'fs';
import { resolve } from 'path';

export function getFileNamesRecursively(directory: string): string[] {
  const directoryEntries = readdirSync(directory, { withFileTypes: true });

  const files = directoryEntries.map((directoryEntry: Dirent) => {
    const pathName = resolve(directory, directoryEntry.name);
    return directoryEntry.isDirectory() ? getFileNamesRecursively(pathName) : pathName;
  });

  return Array.prototype.concat(...files);
}

export function hasSrcFilenameForTypeName(typeName: string) {
  const filePathNames = getFileNamesRecursively(process.cwd() + '/src');

  const foundFilePathName = filePathNames.find((filePathName: string) => {
    return filePathName.endsWith('/' + typeName + '.ts');
  });

  return !!foundFilePathName;
}

export default function getSrcFilePathNameForTypeName(typeName: string): string {
  const filePathNames = getFileNamesRecursively(process.cwd() + '/src');

  const foundFilePathNames = filePathNames.filter((filePathName: string) => {
    return filePathName.endsWith('/' + typeName + '.ts');
  });

  if (foundFilePathNames.length === 0) {
    throw new Error('File not found for type: ' + typeName);
  } else if (foundFilePathNames.length > 1) {
    throw new Error('Multiple types with same name not supported: ' + typeName);
  }

  return foundFilePathNames[0];
}
