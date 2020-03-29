import { Dirent, readdirSync } from 'fs';
import { resolve } from 'path';

function getFileNamesRecursively(directory: string): string[] {
  const directoryEntries = readdirSync(directory, { withFileTypes: true });

  const files = directoryEntries.map((directoryEntry: Dirent) => {
    const pathName = resolve(directory, directoryEntry.name);
    return directoryEntry.isDirectory() ? getFileNamesRecursively(pathName) : pathName;
  });

  return Array.prototype.concat(...files);
}

export default function getSrcFilenameForTypeName(typeName: string): string {
  const filePathNames = getFileNamesRecursively(process.cwd() + '/src');

  const foundFilePathNames = filePathNames.filter((filePathName: string) => {
    const filePathNameParts = filePathName.split('/');
    const fileNameBase = filePathNameParts[filePathNameParts.length - 1].split('.')[0];
    return fileNameBase === typeName;
  });

  if (foundFilePathNames.length === 0) {
    throw new Error('File not found for type: ' + typeName);
  } else if (foundFilePathNames.length > 1) {
    throw new Error('Multiple types with same name not supported: ' + typeName);
  }


  return foundFilePathNames[0];
}
